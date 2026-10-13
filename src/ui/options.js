(function () {
  'use strict';
  const api = globalThis.browser || globalThis.chrome, R = globalThis.HexStreamRules, L = globalThis.HexStreamLanguages;
  const $ = id => document.getElementById(id);
  const descriptions = {
    tags: ['Tags', 'Blocked tags', 'Hide streams with matching tags, including undisplayed tags when Twitch supplies them.', 'Add a tag, or import your existing lists.'],
    titles: ['Titles', 'Blocked titles', 'Hide streams with matching titles. Use ~ before a phrase to match it anywhere in a title.', 'Example: ~MyTeamIsPerfect'],
    channels: ['Users', 'Blocked users', 'Hide matching channel usernames or display names.', 'Add a channel username or display name.'],
    categories: ['Categories', 'Blocked categories', 'Hide matching games and categories, including category cards.', 'Add a game or category name.'],
    allowedChannels: ['Whitelists', 'Always allow users', 'These users bypass every block list. Use this for channels you always want to see.', 'Add a channel username or display name.'],
    allowedUsernames: ['Whitelists', 'User exceptions', 'Protect matching usernames or display names from the Users block list. Other block lists still apply.', 'Add an exception to your Users list.'],
    allowedTitles: ['Whitelists', 'Title exceptions', 'Protect matching titles from the Titles block list. User, category and tag rules still apply.', 'Add a title or ~phrase to allow.'],
    allowedTags: ['Whitelists', 'Tag exceptions', 'Protect matching tags from the Tags block list. Other blocked tags and other block lists still apply.', 'Add a tag to allow.'],
  };
  let saved = R.defaults(), draft = R.defaults(), selected = 'tags', whitelist = 'allowedChannels', busy = false, loaded = false;
  const lines = () => $('rules').value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const allowed = field => field.startsWith('allowed');
  const total = fields => fields.reduce((sum, field) => sum + draft[field].length, 0);
  const dirty = () => draft.enabled !== saved.enabled || R.FIELDS.some(field => JSON.stringify(draft[field]) !== JSON.stringify(saved[field]));
  function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
  function lock(value) { busy = value; for (const control of document.querySelectorAll('button,input,textarea')) control.disabled = value; }
  if (!api?.runtime) { status('HexStream is unavailable in this window. Use a normal window, or allow the extension in private windows.', true); lock(true); return; }
  async function send(message) { const response = await api.runtime.sendMessage(message); if (!response?.ok) throw new Error(response?.error || 'Extension unavailable.'); return response.value; }
  function collect() { if (selected !== 'languages') draft[selected] = lines(); draft.enabled = $('enabled').checked; }
  const characterRules = () => [...new Set(L.SCOPES.flatMap(field => draft[field].filter(L.isCharacterRule)))];
  function languageSummary() {
    const known = new Set(L.PRESETS.map(preset => preset.rule)), size = characterRules().filter(rule => !known.has(rule)).length;
    $('language-legacy').hidden = !size;
    $('language-legacy').textContent = size + ' custom character ' + (size === 1 ? 'rule is' : 'rules are') + ' already active in your lists. Their exact behavior is preserved. Uncheck a field here to remove that rule from that field; named presets do not override it.';
  }
  function counts() {
    for (const badge of document.querySelectorAll('[data-count]')) badge.textContent = badge.dataset.count === 'whitelists' ? total(R.FIELDS.filter(allowed)) : badge.dataset.count === 'languages' ? characterRules().length : draft[badge.dataset.count].length;
    const size = selected === 'languages' ? characterRules().length : draft[selected].length;
    $('count').textContent = size + (size === 1 ? ' rule in this list' : ' rules in this list');
    $('list-count').textContent = size + (size === 1 ? ' rule' : ' rules');
    $('total').textContent = total(R.FIELDS.filter(field => !allowed(field))) + ' blocked · ' + total(R.FIELDS.filter(allowed)) + ' exceptions';
    $('save-state').textContent = dirty() ? 'Unsaved changes' : 'All changes saved';
    $('save-state').classList.toggle('unsaved', dirty());
    if (selected === 'languages') languageSummary();
  }
  function render() {
    const section = allowed(selected) ? 'whitelists' : selected;
    for (const tab of document.querySelectorAll('[data-section]')) { const active = tab.dataset.section === section; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; }
    $('rule-panel').setAttribute('aria-labelledby', 'tab-' + section);
    $('whitelist-switches').hidden = section !== 'whitelists';
    $('text-editor').hidden = section === 'languages'; $('language-editor').hidden = section !== 'languages';
    for (const button of document.querySelectorAll('[data-field]')) button.setAttribute('aria-pressed', String(button.dataset.field === selected));
    $('enabled').checked = draft.enabled;
    if (section === 'languages') {
      $('list-title').textContent = 'Languages'; $('list-kind').textContent = 'Writing systems & characters';
      $('list-description').textContent = 'Set language-related character filters for Tags, Titles and Users without editing a wall of regex.';
      renderLanguages(); counts(); return;
    }
    const [title, label, description, placeholder] = descriptions[selected];
    $('list-title').textContent = title; $('editor-label').textContent = label; $('list-description').textContent = description;
    $('list-kind').textContent = section === 'whitelists' ? 'Exceptions' : 'Block list';
    $('rules').placeholder = placeholder; $('rules').value = draft[selected].join('\n'); $('enabled').checked = draft.enabled;
    counts();
  }
  function filterLanguages() {
    const query = R.normalize($('language-search').value); let visible = 0;
    for (const row of $('language-rows').children) { row.hidden = !row.dataset.search.includes(query); if (!row.hidden) visible++; }
    $('language-empty').hidden = visible > 0;
  }
  function renderLanguages() {
    const known = new Set(L.PRESETS.map(preset => preset.rule)), custom = characterRules().filter(rule => !known.has(rule));
    const entries = [...custom.map((rule, index) => ({id: 'custom-' + index, label: 'Custom character rule ' + (index + 1), sample: 'From your existing lists', keywords: 'custom existing imported', rule, custom: true})), ...L.PRESETS];
    $('language-rows').replaceChildren();
    for (const entry of entries) {
      const row = document.createElement('tr'); row.dataset.language = entry.id; row.dataset.search = R.normalize(entry.label + ' ' + entry.keywords);
      const name = document.createElement('th'); name.scope = 'row';
      const label = document.createElement('strong'); label.textContent = entry.label;
      const sample = document.createElement('small'); sample.textContent = entry.sample; name.append(label, sample);
      if (entry.note) { const note = document.createElement('small'); note.textContent = entry.note; name.append(note); }
      if (entry.custom) { const details = document.createElement('details'), summary = document.createElement('summary'), code = document.createElement('code'); summary.textContent = 'View rule'; code.textContent = entry.rule; details.append(summary, code); name.append(details); }
      row.append(name);
      for (const field of L.SCOPES) {
        const cell = document.createElement('td'), checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.scope = field;
        checkbox.setAttribute('aria-label', entry.label + ' — ' + (field === 'channels' ? 'Users' : field === 'titles' ? 'Titles' : 'Tags'));
        checkbox.checked = draft[field].includes(entry.rule);
        checkbox.addEventListener('change', () => {
          const next = {...draft, [field]: checkbox.checked ? [...draft[field], entry.rule] : draft[field].filter(rule => rule !== entry.rule)};
          try { R.validate(next); draft = next; counts(); status('Language choices updated in your draft. Save rules to apply.'); }
          catch (error) { checkbox.checked = !checkbox.checked; status(error.message, true); }
        });
        cell.append(checkbox); row.append(cell);
      }
      $('language-rows').append(row);
    }
    filterLanguages();
  }
  function select(field) { if (busy) return; collect(); selected = field; if (allowed(field)) whitelist = field; render(); }
  async function load() { saved = await send({type: 'getSettings'}); draft = R.validate(saved); loaded = true; render(); }
  for (const tab of document.querySelectorAll('[data-section]')) tab.addEventListener('click', () => select(tab.dataset.section === 'whitelists' ? whitelist : tab.dataset.section));
  $('sections').addEventListener('keydown', event => {
    const tabs = [...document.querySelectorAll('[data-section]')], index = tabs.indexOf(document.activeElement);
    if (index < 0 || !['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); tabs[next].click();
  });
  for (const button of document.querySelectorAll('[data-field]')) button.addEventListener('click', () => select(button.dataset.field));
  $('rules').addEventListener('input', () => { collect(); counts(); });
  $('language-search').addEventListener('input', filterLanguages);
  $('enabled').addEventListener('change', () => { collect(); counts(); });
  $('reload').addEventListener('click', async () => { lock(true); try { await load(); status('Loaded saved rules.'); } catch(e) { status(e.message, true); } finally { lock(false); } });
  $('save').addEventListener('click', async () => {
    collect(); lock(true);
    try { const settings = R.validate(draft); saved = await send({type: 'replaceSettings', settings, expectedRevision: saved.revision}); draft = R.validate(saved); render(); status('Saved. Applied across all Twitch tabs.'); }
    catch(e) {
      if (e.field && descriptions[e.field]) { selected = e.field; render(); if (Number.isInteger(e.ruleIndex)) { const entries = $('rules').value.split('\n'), start = entries.slice(0, e.ruleIndex).reduce((sum, line) => sum + line.length + 1, 0); $('rules').setSelectionRange(start, start + (entries[e.ruleIndex]?.length || 0)); } }
      status(e.message, true);
    } finally { lock(false); if ($('status').classList.contains('error')) $('rules').focus(); }
  });
  $('choose-import').addEventListener('click', () => $('import').click());
  $('import').addEventListener('change', async () => {
    const file = $('import').files[0]; if (!file) return;
    collect(); lock(true);
    try {
      if (file.size > 2000000) throw new Error('Import must be smaller than 2 MB.');
      const imported = R.parseImport(await file.text(), $('listsOnly').checked); draft = imported.settings; render();
      status('Imported ' + total(R.FIELDS) + ' rules for review. Click Save rules to apply.' + (imported.omitted.length ? ' Left out: ' + imported.omitted.join(', ') + '.' : ''));
    } catch(e) { status(e.message, true); }
    finally { $('import').value = ''; lock(false); }
  });
  $('export').addEventListener('click', async () => {
    try {
      const settings = await send({type: 'getSettings'}), url = URL.createObjectURL(new Blob([JSON.stringify(settings, null, 2) + '\n'], {type: 'application/json'}));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'HexStream-Filters.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      status('Exported saved rules.' + (dirty() ? ' Unsaved edits are not included.' : ''));
    } catch(e) { status(e.message, true); }
  });
  addEventListener('beforeunload', event => { if (loaded && dirty()) { event.preventDefault(); event.returnValue = ''; } });
  lock(true); load().catch(e => status(e.message, true)).finally(() => { if (loaded) lock(false); });
})();
