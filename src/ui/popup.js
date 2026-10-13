(async function () {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;
  const $ = id => document.getElementById(id);
  if (!api?.runtime) { $('status').textContent = 'Use a normal window, or allow HexStream in private windows.'; for (const control of document.querySelectorAll('button,input')) control.disabled = true; return; }
  async function send(message) { const result = await api.runtime.sendMessage(message); if (!result?.ok) throw new Error(result?.error || 'Could not load settings.'); return result.value; }
  function error(e) { $('status').textContent = e.message; $('status').classList.add('error'); }
  let tab;
  try {
    const settings = await send({type: 'getSettings'}); $('enabled').checked = settings.enabled;
    [tab] = await api.tabs.query({active: true, currentWindow: true});
    if (tab?.id && tab.url?.startsWith('https://www.twitch.tv/')) {
      try { const status = await api.tabs.sendMessage(tab.id, {type: 'tabStatus'}); if (status) { $('hidden').textContent = status.hidden + ' hidden'; $('coverage').textContent = status.fullMetadata + ' / ' + status.total + ' loaded cards have full tag metadata.'; } } catch { $('coverage').textContent = 'Reload Twitch after loading or updating the extension.'; }
    }
  } catch (e) { error(e); }
  $('enabled').addEventListener('change', async () => { const desired = $('enabled').checked; $('enabled').disabled = true; try { await send({type: 'setEnabled', enabled: desired}); $('status').textContent = desired ? 'Filtering enabled in all Twitch tabs.' : 'Filtering paused in all Twitch tabs.'; } catch(e) { $('enabled').checked = !desired; error(e); } finally { $('enabled').disabled = false; } });
  $('manage').addEventListener('click', () => api.runtime.openOptionsPage());
  $('reasons').addEventListener('click', async () => { try { if (!tab?.url?.startsWith('https://www.twitch.tv/')) throw new Error('Open Twitch first.'); await api.tabs.sendMessage(tab.id, {type: 'showReasons'}); window.close(); } catch(e) { error(e); } });
})();
