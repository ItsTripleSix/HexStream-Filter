// The Chrome build imports the shared engine here; Firefox loads it as a preceding background script.
if (typeof importScripts === 'function' && !globalThis.HexStreamRules) importScripts('vendor/re2js.js', 'core/rules.js');
(function () {
  'use strict';
  const api = globalThis.browser || globalThis.chrome, R = globalThis.HexStreamRules;
  let queue = Promise.resolve();
  async function read() { const stored = (await api.storage.local.get(R.KEY))[R.KEY]; return stored ? R.validate(stored) : R.defaults(); }
  async function handle(message) {
    const current = await read();
    if (message.type === 'getSettings') return current;
    let next;
    if (message.type === 'replaceSettings') {
      if (message.expectedRevision !== current.revision) throw new Error('Rules changed in another tab. Reload the editor before saving.');
      next = R.validate(message.settings);
    } else if (message.type === 'addRule' || message.type === 'removeRule') {
      if (!R.FIELDS.includes(message.field)) throw new Error('Unknown rule list.');
      R.matcher(message.rule);
      const rule = message.rule.trim();
      const exists = current[message.field].includes(rule);
      if ((message.type === 'addRule' && exists) || (message.type === 'removeRule' && !exists)) return {...current, changed: false};
      next = R.validate({...current, [message.field]: message.type === 'addRule' ? [...current[message.field], rule] : current[message.field].filter(value => value !== rule)});
    } else if (message.type === 'setEnabled') {
      if (typeof message.enabled !== 'boolean') throw new Error('Expected true or false.');
      next = {...current, enabled: message.enabled};
    } else throw new Error('Unknown request.');
    next.revision = current.revision + 1;
    await api.storage.local.set({[R.KEY]: next});
    return {...next, changed: true};
  }
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== api.runtime.id || !message || typeof message !== 'object') return false;
    const result = queue.then(() => handle(message)); queue = result.catch(() => {});
    result.then(value => respond({ok: true, value}), error => respond({ok: false, error: error.message}));
    return true;
  });
})();
