(function (root) {
  'use strict';
  const FIELDS = Object.freeze(['categories', 'channels', 'tags', 'titles', 'allowedChannels', 'allowedUsernames', 'allowedTitles', 'allowedTags']);
  const KEY = 'hexstream.settings.v1';
  const MAX_ENTRIES = 10000, MAX_RULE = 4096, MAX_IMPORT = 2000000;
  const LinearRegex = root.RE2JS?.RE2JS || (typeof module !== 'undefined' && module.exports ? require('../vendor/re2js.js').RE2JS : null);
  const regexCache = new Map();
  const normalize = value => String(value ?? '').trim().normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const defaults = () => Object.fromEntries([['schemaVersion', 1], ['revision', 0], ['enabled', true], ...FIELDS.map(key => [key, []])]);
  function matcher(rule) {
    if (typeof rule !== 'string' || !rule.trim() || rule.length > MAX_RULE) throw new Error('Each rule must contain 1–4096 characters.');
    if (rule[0] === "'" && rule.at(-1) === "'" && rule.length > 2) {
      const literal = rule.slice(1, -1); return value => value === literal;
    }
    if (rule.startsWith('/')) {
      const last = rule.lastIndexOf('/');
      if (last <= 0) throw new Error('Regex rules need a closing slash.');
      const pattern = rule.slice(1, last), flags = rule.slice(last + 1);
      if (!/^[imsu]*$/.test(flags) || new Set(flags).size !== flags.length) throw new Error('Supported regex flags: i, m, s, u.');
      if (regexCache.has(rule)) return regexCache.get(rule);
      if (!LinearRegex) throw new Error('Regex engine unavailable. Reload the extension.');
      // Validate JavaScript syntax without executing it. All matching uses the bundled linear-time engine.
      try { new RegExp(pattern, flags); } catch { throw new Error('Invalid regex syntax. Check brackets, escapes and the closing slash.'); }
      let regex;
      try { regex = LinearRegex.compile(LinearRegex.translateRegExp(new RegExp(pattern, flags))); }
      catch { throw new Error('Unsupported regex. Groups, alternatives and repetitions work; lookarounds, backreferences and repetition counts above 1,000 do not.'); }
      const test = value => regex.test(String(value).slice(0, 1000));
      if (regexCache.size >= 128) regexCache.delete(regexCache.keys().next().value);
      regexCache.set(rule, test);
      return test;
    }
    const contains = rule.startsWith('~') || (rule.startsWith('*') && rule.endsWith('*'));
    const text = normalize(rule.startsWith('~') ? rule.slice(1) : contains ? rule.slice(1, -1) : rule);
    if (!text) throw new Error('A contains rule must include text.');
    return contains ? value => normalize(value).includes(text) : value => normalize(value) === text;
  }
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a filter settings object.');
    const result = defaults();
    if (input.enabled !== undefined && typeof input.enabled !== 'boolean') throw new Error('enabled must be true or false.');
    result.enabled = input.enabled ?? true;
    result.revision = Number.isSafeInteger(input.revision) && input.revision >= 0 ? input.revision : 0;
    let total = 0;
    for (const field of FIELDS) {
      if (input[field] !== undefined && !Array.isArray(input[field])) throw new Error(field + ' must be a list.');
      const entries = input[field] || [];
      total += entries.length;
      if (total > MAX_ENTRIES) throw new Error('Maximum 10,000 combined rules.');
      result[field] = [...new Set(entries.map((rule, index) => {
        try { if (typeof rule !== 'string') throw new Error('Rules must be text.'); const trimmed = rule.trim(); matcher(trimmed); return trimmed; }
        catch (error) { const problem = new Error(field + ', rule ' + (index + 1) + ': ' + error.message); problem.field = field; problem.ruleIndex = index; throw problem; }
      }))];
    }
    return result;
  }
  function parseImport(text, listsOnly = false) {
    if (typeof text !== 'string' || text.length > MAX_IMPORT) throw new Error('Import must be smaller than 2 MB.');
    const input = JSON.parse(text);
    const unsupported = ['englishOnly', 'blockNonEnglishCharacters', 'detectTitleLanguage', 'useDeclaredLanguageAlone', 'allowFollowedChannels', 'blockEmojis', 'blockAllEmojis', 'blockedEmojis', 'allowedEmojis', 'allowedWords']
      .filter(key => Array.isArray(input?.[key]) ? input[key].length > 0 : input?.[key] === true);
    if (unsupported.length && !listsOnly) throw new Error('This file uses phone-only options: ' + unsupported.join(', ') + '. Choose “Compatible lists only” to leave those options out explicitly.');
    return {settings: validate(input), omitted: listsOnly ? unsupported : []};
  }
  function compile(settings) {
    const rules = validate(settings);
    const compiled = Object.fromEntries(FIELDS.map(field => {
      const exact = new Map(), literal = new Map(), patterns = [];
      rules[field].forEach((rule, index) => {
        const entry = {rule, index, test: matcher(rule)};
        if (rule[0] === "'" && rule.at(-1) === "'") { const key = rule.slice(1, -1); if (!literal.has(key)) literal.set(key, entry); }
        else if (rule.startsWith('/') || rule.startsWith('~') || (rule.startsWith('*') && rule.endsWith('*'))) {
          if (!rule.startsWith('/')) entry.contains = normalize(rule.startsWith('~') ? rule.slice(1) : rule.slice(1, -1));
          patterns.push(entry);
        } else { const key = normalize(rule); if (!exact.has(key)) exact.set(key, entry); }
      });
      return [field, {exact, literal, patterns}];
    }));
    function first(field, values) {
      for (const value of values.filter(v => typeof v === 'string' && v)) {
        const index = compiled[field], normalized = normalize(value);
        let best = index.exact.get(normalized), literal = index.literal.get(value);
        if (literal && (!best || literal.index < best.index)) best = literal;
        for (const entry of index.patterns) {
          if (best && entry.index >= best.index) break;
          if (entry.contains !== undefined ? normalized.includes(entry.contains) : entry.test(value)) { best = entry; break; }
        }
        if (best) return {field, rule: best.rule, value};
      }
      return null;
    }
    return {rules, evaluate(item) {
      if (!rules.enabled) return null;
      const names = [item.login, item.displayName];
      if (first('allowedChannels', names)) return null;
      const fields = item.kind === 'category' ? [['categories', [item.category]]] : [
        ['channels', names.filter(name => !first('allowedUsernames', [name]))],
        ['categories', [item.category]],
        ['titles', first('allowedTitles', [item.title]) ? [] : [item.title]],
        ['tags', (item.tags || []).filter(tag => !first('allowedTags', [tag]))],
      ];
      for (const [field, values] of fields) { const reason = first(field, values); if (reason) return reason; }
      return null;
    }};
  }
  const literalRule = value => "'" + String(value) + "'";
  root.HexStreamRules = Object.freeze({FIELDS, KEY, defaults, normalize, matcher, validate, parseImport, compile, literalRule});
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HexStreamRules;
})(globalThis);
