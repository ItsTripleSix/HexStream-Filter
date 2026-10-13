(function (root) {
  'use strict';
  const text = (value, max = 1000) => typeof value === 'string' ? value.slice(0, max) : '';
  const login = value => /^[a-z0-9_]{1,25}$/i.test(value || '') ? value.toLowerCase() : '';
  function tagsOf(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.slice(0, 100).map(tag => text(typeof tag === 'string' ? tag : tag?.name || tag?.localizedName || tag?.tagName, 200)).filter(Boolean))];
  }
  function sanitize(item) {
    if (!item || typeof item !== 'object' || !login(item.login)) return null;
    return {login: login(item.login), id: /^\d{1,30}$/.test(item.id || '') ? item.id : '', displayName: text(item.displayName, 100), title: text(item.title), category: text(item.category, 200), tags: tagsOf(item.tags), fullTags: item.fullTags === true};
  }
  function extract(payload) {
    const found = new Map(); let visits = 0;
    function walk(value, depth) {
      if (!value || typeof value !== 'object' || depth > 18 || ++visits > 30000) return;
      if (!Array.isArray(value)) {
        const broadcaster = value.broadcaster || value.owner || value.creator || value;
        const stream = value.stream && typeof value.stream === 'object' ? value.stream : value;
        const name = login(broadcaster.login);
        const completeTags = Array.isArray(stream.freeformTags);
        const hasTags = completeTags || Array.isArray(stream.tags);
        if (name && (hasTags || stream.__typename === 'Stream' || value.stream)) {
          const record = sanitize({login: name, id: broadcaster.id, displayName: broadcaster.displayName,
            title: stream.title || value.broadcastSettings?.title, category: stream.game?.displayName || stream.game?.name || value.broadcastSettings?.game?.name,
            // Player responses can include only legacy/automatic tags. They cannot replace a complete freeform list.
            tags: [...tagsOf(stream.freeformTags), ...tagsOf(stream.tags), ...tagsOf(stream.curatedTags)], fullTags: completeTags});
          const previous = found.get(name);
          if (record && (!previous || record.fullTags || !previous.fullTags)) found.set(name, record);
        }
      }
      for (const [key, child] of Object.entries(value)) {
        // Do not traverse account, credential, chat, payment or unrelated response subtrees.
        if (/token|cookie|auth|session|integrity|password|email|message|payment|currentUser|viewer/i.test(key) && key !== 'viewers') continue;
        if (child && typeof child === 'object') walk(child, depth + 1);
      }
    }
    walk(payload, 0); return [...found.values()].slice(0, 500);
  }
  class Store {
    constructor({max = 2000, ttl = 300000, now = Date.now} = {}) { this.items = new Map(); this.max = max; this.ttl = ttl; this.now = now; }
    put(records) {
      let changed = 0;
      for (const raw of records.slice(0, 500)) {
        const item = sanitize(raw); if (!item) continue;
        const old = this.get(item.login);
        if (old?.fullTags && !item.fullTags) continue;
        const same = old && ['id', 'displayName', 'title', 'category', 'fullTags'].every(key => old[key] === item[key]) && old.tags.length === item.tags.length && old.tags.every((tag, index) => tag === item.tags[index]);
        this.items.delete(item.login); this.items.set(item.login, {...item, observedAt: this.now()});
        if (!same) changed++;
      }
      while (this.items.size > this.max) this.items.delete(this.items.keys().next().value);
      return changed;
    }
    get(name) { const key = login(name), item = this.items.get(key); if (item && this.now() - item.observedAt <= this.ttl) return item; this.items.delete(key); return null; }
  }
  root.HexStreamMetadata = Object.freeze({text, login, tagsOf, sanitize, extract, Store});
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HexStreamMetadata;
})(globalThis);
