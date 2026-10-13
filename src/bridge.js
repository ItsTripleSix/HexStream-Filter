(function () {
  'use strict';
  const project = globalThis.HexStreamMetadata;
  if (!project || globalThis.__hexstreamMetadataBridge) return;
  globalThis.__hexstreamMetadataBridge = true;
  const store = new project.Store({max: 500});
  const origin = location.origin, topic = 'hexstream:public-metadata:v1';
  const gql = input => { try { const url = new URL(typeof input === 'string' || input instanceof URL ? input : input?.url, location.href); return url.protocol === 'https:' && url.hostname === 'gql.twitch.tv' && url.pathname === '/gql'; } catch { return false; } };
  function publish(body) {
    try { const items = project.extract(body); if (!items.length) return; store.put(items); window.postMessage({topic, items}, origin); } catch { /* Filtering must not break Twitch's requests. */ }
  }
  function parse(text) { if (typeof text === 'string' && text.length <= 4000000) { try { publish(JSON.parse(text)); } catch {} } }
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const result = Reflect.apply(originalFetch, this, args);
    if (gql(args[0])) result.then(response => {
      if (response.ok && gql(response.url) && (!response.headers.get('content-length') || Number(response.headers.get('content-length')) <= 4000000)) response.clone().text().then(parse).catch(() => {});
    }).catch(() => {});
    return result;
  };
  const originalOpen = XMLHttpRequest.prototype.open, urls = new WeakMap();
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    urls.set(this, gql(url)); return Reflect.apply(originalOpen, this, [method, url, ...rest]);
  };
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    if (urls.get(this)) this.addEventListener('load', () => {
      try { if (urls.get(this) && gql(this.responseURL) && this.status >= 200 && this.status < 300) { if (this.responseType === 'json') publish(this.response); else if (!this.responseType || this.responseType === 'text') parse(this.responseText); } } catch {}
    }, {once: true});
    return Reflect.apply(originalSend, this, args);
  };
  window.addEventListener('message', event => {
    if (event.source === window && event.origin === origin && event.data?.topic === 'hexstream:metadata-ready:v1') {
      window.postMessage({topic, items: [...store.items.values()].slice(-500)}, origin);
    }
  });
})();
