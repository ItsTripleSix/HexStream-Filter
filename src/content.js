(function () {
  'use strict';
  const api = globalThis.browser || globalThis.chrome, R = globalThis.HexStreamRules, M = globalThis.HexStreamMetadata;
  const metadata = new M.Store(), processed = new Map(), cardStates = new WeakMap(), recent = new Map();
  let engine = R.compile(R.defaults()), queued = false, started = false, panel = null;
  const topic = 'hexstream:public-metadata:v1';
  const selectors = 'article, .game-card, .side-nav-card, [data-a-target="side-nav-card"], [data-a-target="search-result-live-channel"], [data-a-target="search-result-channel"]';
  const tagSelector = '.tw-tag, [data-a-target="tag"], [data-test-selector="Tag"]';
  function send(message) { return api.runtime.sendMessage(message).then(result => { if (!result?.ok) throw new Error(result?.error || 'Extension is unavailable. Reload this page.'); return result.value; }); }
  function node(tag, value, className) { const el = document.createElement(tag); if (value !== undefined) el.textContent = value; if (className) el.className = className; return el; }
  function createPanel(title) {
    panel?.host.remove();
    const host = node('div'); host.id = 'hexstream-panel';
    const shadow = host.attachShadow({mode: 'closed'});
    const style = node('style', ':host{all:initial;position:fixed;inset:0;z-index:2147483647;font:14px/1.5 system-ui;color:#fff5e6}*{box-sizing:border-box}.backdrop{position:absolute;inset:0;background:#0008}.panel{position:absolute;right:20px;top:20px;bottom:20px;width:min(430px,calc(100vw - 40px));padding:24px;background:#171b1b;border:1px solid #fff5e630;border-radius:18px;box-shadow:0 20px 80px #0008;overflow:auto}h2{font-size:24px;margin:0 0 4px}h3{font-size:14px;margin:22px 0 8px;color:#9ee4bc}p{color:#c9cdc7;margin:8px 0}button{font:inherit;border:1px solid #fff5e639;border-radius:8px;padding:8px 12px;background:#272e2c;color:#fff5e6;cursor:pointer;margin:4px 4px 4px 0}button:hover,button:focus-visible{border-color:#9ee4bc;outline:2px solid #9ee4bc;outline-offset:1px}button:disabled{opacity:.5;cursor:wait}.close{float:right}.tags{display:flex;flex-wrap:wrap}.notice{padding:10px;border:1px solid #9ee4bc50;border-radius:8px}.error{color:#ffbdbd}.record{border-top:1px solid #ffffff20;padding:12px 0}small{color:#aeb8b0}.primary{background:#9ee4bc;color:#14251b;font-weight:700}');
    const backdrop = node('div', undefined, 'backdrop'), box = node('section', undefined, 'panel');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', title); box.tabIndex = -1;
    const previousFocus = document.activeElement;
    const close = () => { host.remove(); panel = null; if (previousFocus?.isConnected) previousFocus.focus(); };
    const closeButton = node('button', 'Close', 'close'); closeButton.addEventListener('click', close); backdrop.addEventListener('click', close);
    box.append(closeButton, node('h2', title)); shadow.append(style, backdrop, box); (document.body || document.documentElement).append(host);
    host.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const focusable = [...box.querySelectorAll('button:not(:disabled),a[href],input,textarea')];
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && shadow.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && shadow.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    panel = {host, box}; closeButton.focus(); return box;
  }
  function action(box, label, handler, primary = false) {
    const button = node('button', label, primary ? 'primary' : '');
    button.addEventListener('click', async () => { button.disabled = true; try { await handler(); } catch (error) { const p = node('p', error.message, 'error'); p.setAttribute('role', 'alert'); box.append(p); } finally { button.disabled = false; } });
    box.append(button); return button;
  }
  async function quickRule(box, field, rule) {
    const next = await send({type: 'addRule', field, rule}); engine = R.compile(next); schedule();
    const message = node('p', next.changed ? 'Saved. Your rules now apply in every Twitch tab.' : 'That rule is already saved.', 'notice'); message.setAttribute('role', 'status'); box.append(message);
    if (next.changed) action(box, 'Undo this rule', async () => { engine = R.compile(await send({type: 'removeRule', field, rule})); message.textContent = 'Rule removed.'; schedule(); });
  }
  function inspect(item, root) {
    const box = createPanel(item.displayName || item.login || item.category || 'HexStream Filter');
    const visibleTags = M.tagsOf([...root.querySelectorAll(tagSelector)].map(tag => tag.textContent.trim()));
    box.append(node('p', item.title || item.category || 'Your directory. Your rules.'));
    const reason = engine.evaluate(item);
    if (reason) box.append(node('p', 'Hidden by ' + reason.field + ': ' + reason.rule + ' → ' + reason.value, 'notice'));
    if (item.login) action(box, 'Block channel', () => quickRule(box, 'channels', item.login), true);
    if (item.category) action(box, 'Block category', () => quickRule(box, 'categories', item.category));
    if (item.title) action(box, 'Block this exact title', () => quickRule(box, 'titles', R.literalRule(item.title)));
    if (item.login) action(box, 'Always allow channel', () => quickRule(box, 'allowedChannels', item.login));
    box.append(node('h3', 'Tags · ' + item.tags.length + ' available / ' + visibleTags.length + ' on card'));
    box.append(node('p', item.fullTags ? 'Full tag metadata received from Twitch. Tags absent from the card are checked too.' : 'Visible tags only. This view has not supplied complete tag metadata yet.', 'notice'));
    const tags = node('div', undefined, 'tags'); box.append(tags);
    for (const tag of item.tags) action(tags, 'Block ' + tag, () => quickRule(box, 'tags', tag));
    if (!item.tags.length) box.append(node('p', 'No tags supplied for this item.'));
  }
  function retainItem(item, previous) {
    if (!previous || previous.identity !== item.identity) return item;
    // Responsive cards drop chips/text when display:none gives them no width. Missing DOM data is not a removal.
    item.title ||= previous.title;
    item.category ||= previous.category;
    if (item.displayName === item.login && previous.displayName) item.displayName = previous.displayName;
    if (item.kind === 'stream' && !item.fullTags) {
      item.tags = previous.fullTags ? previous.tags : M.tagsOf([...previous.tags, ...item.tags]);
      item.fullTags = previous.fullTags;
    }
    return item;
  }
  function getItem(card, previous) {
    const link = card.querySelector('a[data-a-target="preview-card-channel-link"],a[data-a-target="preview-card-image-link"],a[data-a-target="side-nav-card"],a[data-test-selector="TitleAndChannel"]') || (card.matches('a') ? card : null) || card.querySelector('a[href]');
    if (!link) return null;
    let path; try { const url = new URL(link.href, location.href); if (url.origin !== location.origin) return null; path = url.pathname; } catch { return null; }
    const categoryLink = card.querySelector('a[href^="/directory/category/"]');
    const login = M.login(path.split('/')[1]);
    if (path.startsWith('/directory/category/')) {
      let category = card.querySelector('h2,h3,h4')?.textContent?.trim();
      if (!category && previous?.identity === 'category:' + path) category = previous.category;
      if (!category) { try { category = decodeURIComponent(path.split('/')[3] || '').replace(/-/g, ' '); } catch { return null; } }
      return {identity: 'category:' + path, kind: 'category', login: '', category, tags: [], fullTags: false};
    }
    if (!login || ['directory', 'videos', 'search', 'downloads', 'settings', 'subscriptions'].includes(login)) return null;
    const cached = metadata.get(login);
    const mediaLink = card.querySelector('a[data-a-target="preview-card-image-link"],a[href^="/videos/"],a[href*="/clip/"]');
    const mediaPath = mediaLink ? new URL(mediaLink.href, location.href).pathname : '';
    const archived = /^\/videos\/|\/clip\//.test(mediaPath);
    const title = card.querySelector('[data-a-target="preview-card-title-link"],[data-test-selector="search-result-live-channel__title"],h3,h4')?.textContent?.trim() || '';
    const displayName = card.querySelector('[data-a-target="side-nav-title"],a[data-a-target="preview-card-channel-link"]')?.textContent?.trim() || login;
    const item = {identity: archived ? 'video:' + login + ':' + mediaPath : 'stream:' + login, kind: archived ? 'video' : 'stream', login, displayName, title, category: categoryLink?.textContent?.trim() || '', tags: archived ? [] : M.tagsOf([...card.querySelectorAll(tagSelector)].map(tag => tag.textContent.trim())), fullTags: false};
    if (!cached || archived) return retainItem(item, previous);
    return retainItem({...item, ...cached, title: cached.title || title, category: cached.category || item.category, tags: cached.fullTags ? cached.tags : M.tagsOf([...cached.tags, ...item.tags])}, previous);
  }
  function rootFor(card) {
    function singleCard(container) {
      let count = 0;
      for (const child of container.querySelectorAll(selectors)) {
        const parent = child.parentElement?.closest(selectors);
        if ((!parent || !container.contains(parent)) && ++count > 1) return false;
      }
      return count === 1;
    }
    const cell = card.closest('.tw-tower > div');
    if (cell && singleCard(cell)) return cell;
    const candidate = card.closest('[data-target]');
    return candidate && candidate !== document.body && singleCard(candidate) ? candidate : card;
  }
  function release(root) {
    root.removeAttribute('data-hexstream-hidden'); root.removeAttribute('data-hexstream-card');
    root.querySelector(':scope > .hexstream-card-button')?.remove(); processed.delete(root);
  }
  function scan() {
    queued = false; if (!started) return;
    for (const [root, state] of processed) if (!root.isConnected || !state.card.isConnected || !root.contains(state.card)) { cardStates.delete(state.card); release(root); }
    const seen = new Set();
    for (const card of document.querySelectorAll(selectors)) {
      // A nested selector is part of the same card, not a second authority over its visibility.
      if (card.parentElement?.closest(selectors)) continue;
      const root = rootFor(card); if (seen.has(root)) continue;
      const old = cardStates.get(card) || processed.get(root), item = getItem(card, old?.item); if (!item) continue;
      seen.add(root);
      if (old?.root && old.root !== root && processed.get(old.root)?.card === card) release(old.root);
      const reason = engine.evaluate(item), state = {item, card, root, reason};
      processed.set(root, state); cardStates.set(card, state);
      if (!root.hasAttribute('data-hexstream-card')) root.setAttribute('data-hexstream-card', 'true');
      if (reason) {
        if (root.getAttribute('data-hexstream-hidden') !== 'true') root.setAttribute('data-hexstream-hidden', 'true');
        const key = item.login || 'category:' + item.category;
        recent.delete(key); recent.set(key, {item, reason});
        while (recent.size > 100) recent.delete(recent.keys().next().value);
      } else if (root.hasAttribute('data-hexstream-hidden')) root.removeAttribute('data-hexstream-hidden');
      let button = root.querySelector(':scope > .hexstream-card-button');
      if (card.closest('nav,.side-nav-card,[data-a-target="side-nav-card"]')) { button?.remove(); continue; }
      if (!button) {
        button = node('button', '⬡', 'hexstream-card-button'); button.type = 'button'; button.setAttribute('aria-label', 'HexStream: inspect tags or block this item'); button.title = 'HexStream · inspect all tags / block';
        button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); const current = processed.get(root); if (current) inspect(current.item, current.card); }); root.append(button);
      }
      if (old?.item.login !== item.login) button.title = 'HexStream · inspect all tags / block';
    }
    for (const [root, state] of processed) if (!seen.has(root)) { cardStates.delete(state.card); release(root); }
  }
  function schedule() { if (!queued) { queued = true; setTimeout(scan, 80); } }
  function relevantMutation(change) {
    const target = change.target.nodeType === 1 ? change.target : change.target.parentElement;
    if (!target || target.closest('#hexstream-panel,.hexstream-card-button')) return false;
    if (target.closest(selectors) || target.closest('[data-hexstream-card]')) return true;
    if (change.type !== 'childList') return false;
    // Player clocks, chat and unrelated navigation changes must not rescan the entire directory.
    return [...change.addedNodes, ...change.removedNodes].some(child => child.nodeType === 1 && (child.matches(selectors) || child.querySelector(selectors)));
  }
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.topic !== topic || !Array.isArray(event.data.items)) return;
    if (metadata.put(event.data.items)) schedule();
  });
  api.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes[R.KEY]?.newValue) { try { engine = R.compile(changes[R.KEY].newValue); schedule(); } catch {} } });
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== api.runtime.id) return false;
    if (message?.type === 'tabStatus') {
      const records = [...processed.values()]; respond({hidden: records.filter(record => record.reason).length, total: records.length, fullMetadata: records.filter(record => record.item.fullTags).length, enabled: engine.rules.enabled});
    } else if (message?.type === 'showReasons') {
      const box = createPanel('Why hidden?'); box.append(node('p', 'Recent matches in this tab. This list stays in memory and holds at most 100 items.'));
      for (const {item, reason} of [...recent.values()].reverse()) {
        const row = node('div', undefined, 'record'); row.append(node('strong', item.displayName || item.login || item.category), node('p', reason.field + ' · ' + reason.rule + ' → ' + reason.value)); box.append(row);
        action(row, 'Remove matching rule', () => quickRemove(row, reason));
      }
      if (!recent.size) box.append(node('p', 'No hidden items recorded yet.'));
      respond({ok: true});
    }
    return false;
  });
  async function quickRemove(box, reason) { engine = R.compile(await send({type: 'removeRule', field: reason.field, rule: reason.rule})); box.append(node('p', 'Rule removed.')); schedule(); }
  async function start() {
    try { engine = R.compile(await send({type: 'getSettings'})); } catch { /* Neutral defaults until storage becomes available. */ }
    started = true;
    const observer = new MutationObserver(mutations => { if (mutations.some(relevantMutation)) schedule(); });
    observer.observe(document.documentElement, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'title', 'data-a-target', 'data-test-selector']});
    window.addEventListener('popstate', schedule); window.addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    window.postMessage({topic: 'hexstream:metadata-ready:v1'}, location.origin); schedule();
    // TTL cleanup and missed SPA changes, without continuous directory polling.
    setInterval(() => { if (!document.hidden) schedule(); }, 60000);
  }
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start, {once: true});
})();
