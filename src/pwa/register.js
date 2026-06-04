import { registerSW } from 'virtual:pwa-register';

// Auto-update on next visit (vite-plugin-pwa default). If a new SW activates
// mid-session, show a tiny toast so the user can reload to pick it up. Safe to
// reload at any time because storage is write-through to IndexedDB.
export function setupPwa() {
  const updateSW = registerSW({
    onNeedRefresh() {
      showReloadToast(() => updateSW(true));
    },
    onOfflineReady() {
      // Quiet log only; we don't notify the user every time the SW caches.
      console.log('[pwa] offline-ready');
    }
  });
}

function showReloadToast(onReload) {
  if (document.getElementById('pwa-toast')) return;
  const el = document.createElement('div');
  el.id = 'pwa-toast';
  el.innerHTML = `
    <span>New version available</span>
    <button id="pwa-reload">Reload</button>
  `;
  document.body.appendChild(el);
  el.querySelector('#pwa-reload').addEventListener('click', () => {
    el.remove();
    onReload();
  });
}
