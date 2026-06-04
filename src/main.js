import './styles.css';

import { ctx } from './ui/ctx.js';
import { load, save } from './storage/index.js';
import { shouldImport, readLegacy, legacyToState, markImported } from './storage/importer.js';
import { renderTabs, renderDay, saveSession } from './ui/train.js';
import { renderFuel } from './ui/fuel.js';
import { renderToday } from './ui/today.js';
import { setupModal, openGuide, openHistory } from './ui/modals.js';
import { renderAuthOverlay } from './ui/auth.js';
import { isConfigured, supabase } from './sync/supabase.js';
import { getSession, onAuthChange, signOut } from './sync/auth.js';
import { queue, pullRemoteIntoState, startFlusher, onSyncStatus } from './sync/flusher.js';
import { setupPwa } from './pwa/register.js';

let currentMode = 'today';
let syncFailing = false;
let bannerDismissed = false;

function commit(state) {
  save(state).then((next) => {
    ctx.state = next;
    updateSyncIndicator();
    queue(next);
  });
}

function updateSyncIndicator() {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  if (!isConfigured()) {
    el.className = 'sync-indicator';
    el.textContent = 'local-only';
    return;
  }
  if (syncFailing) {
    el.className = 'sync-indicator failed';
    el.textContent = 'sync error';
  } else if (ctx.state.dirty) {
    el.className = 'sync-indicator dirty';
    el.textContent = 'syncing…';
  } else {
    el.className = 'sync-indicator synced';
    el.textContent = 'synced';
  }
}

// Surface repeated background-sync failures. We can't tell a paused Supabase
// project from any other outage, so we name the most likely cause for a
// single-user free-tier setup and point at the dashboard to restore it.
function handleSyncStatus(status) {
  if (status.status === 'failing') {
    syncFailing = true;
    if (!bannerDismissed) showSyncErrorBanner();
  } else {
    syncFailing = false;
    bannerDismissed = false;
    hideSyncErrorBanner();
    // A fully-flushed push leaves nothing queued; reconcile the in-memory flag
    // the badge reads (markClean only persisted it to IndexedDB).
    if (status.flushed && ctx.state) ctx.state.dirty = false;
  }
  updateSyncIndicator();
}

function showSyncErrorBanner() {
  if (document.getElementById('sync-error-banner')) return;
  const el = document.createElement('div');
  el.id = 'sync-error-banner';
  el.innerHTML = `
    <span>Sync isn't working — your Supabase project may be paused (free tier
    pauses after ~7 days idle). Your data is safe on this device; restore the
    project to resume syncing.</span>
    <span class="sync-error-actions">
      <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">Open Supabase</a>
      <button id="sync-error-dismiss" aria-label="Dismiss">×</button>
    </span>
  `;
  document.body.appendChild(el);
  el.querySelector('#sync-error-dismiss').addEventListener('click', () => {
    bannerDismissed = true;
    hideSyncErrorBanner();
  });
}

function hideSyncErrorBanner() {
  document.getElementById('sync-error-banner')?.remove();
}

function switchMode(mode) {
  currentMode = mode;
  ctx.state.mode = mode;
  ctx.commit();
  document.getElementById('modeToday').classList.toggle('active', mode === 'today');
  document.getElementById('modeTrain').classList.toggle('active', mode === 'train');
  document.getElementById('modeFuel').classList.toggle('active', mode === 'fuel');
  document.getElementById('todayView').style.display = mode === 'today' ? 'block' : 'none';
  document.getElementById('trainView').style.display = mode === 'train' ? 'block' : 'none';
  document.getElementById('nutriView').style.display = mode === 'fuel' ? 'block' : 'none';

  const saveBtn = document.getElementById('navSave');
  saveBtn.style.display = mode === 'train' ? '' : 'none';

  if (mode === 'today') renderToday({ goTrain: () => switchMode('train'), goFuel: () => switchMode('fuel') });
  else if (mode === 'train') {
    renderTabs();
    renderDay();
  } else if (mode === 'fuel') {
    renderFuel({ openHistory });
  }
  window.scrollTo(0, 0);
}

async function boot() {
  // One-time legacy import. Guarded by the localStorage marker so a wipe and
  // reinstall doesn't clobber fresh cloud state with stale local.
  if (shouldImport()) {
    const legacy = readLegacy();
    if (legacy) {
      const imported = legacyToState(legacy);
      if (imported) {
        await save(imported);
      }
    }
    markImported();
  }

  let state = await load();

  // If a session exists, pull remote and merge. Last-write-wins single-device,
  // so the remote copy is the source of truth on cold start.
  if (isConfigured()) {
    const session = await getSession();
    if (session) {
      const remote = await pullRemoteIntoState(state);
      if (remote && remote !== state) {
        state = remote;
        await save(state);
      }
    }
  }

  ctx.bind(state, commit);

  setupModal();
  setupPwa();
  startFlusher();
  onSyncStatus(handleSyncStatus);
  bindNav();

  // Initial sync indicator
  updateSyncIndicator();

  // If Supabase configured but no session, show auth card under the header
  // but still render the app so the user can interact local-only.
  if (isConfigured()) {
    const session = await getSession();
    if (!session) {
      const overlay = renderAuthOverlay({
        onSession: () => {
          document.querySelectorAll('.auth-card').forEach((el) => el.remove());
          // Re-pull and re-render after sign-in
          pullRemoteIntoState(ctx.state).then(async (remote) => {
            if (remote && remote !== ctx.state) {
              ctx.state = remote;
              await save(remote);
            }
            updateSyncIndicator();
            switchMode(currentMode);
          });
        }
      });
      if (overlay) document.querySelector('.container').appendChild(overlay);
    }
    onAuthChange((s) => {
      if (!s) {
        // signed out; just re-render same mode
        switchMode(currentMode);
      }
    });
  }

  // Default landing tab: Today.
  switchMode(state.mode === 'fuel' ? 'fuel' : state.mode === 'train' ? 'train' : 'today');
}

function bindNav() {
  document.querySelectorAll('.mode-btn').forEach((el) => {
    el.addEventListener('click', () => switchMode(el.dataset.mode));
  });
  document.getElementById('navHistory').addEventListener('click', openHistory);
  document.getElementById('navGuide').addEventListener('click', openGuide);
  document.getElementById('navSave').addEventListener('click', () => {
    saveSession({
      onSaved: (n) => alert(`Saved ${n} exercises. Next session's weights will auto-adjust.`)
    });
  });

  // Sign-out lives in the sync indicator: tapping it offers a sign-out when
  // there's an active session, otherwise it's just an info badge.
  document.getElementById('syncStatus').addEventListener('click', async () => {
    if (!isConfigured()) return;
    const session = await getSession();
    if (!session) return;
    if (confirm('Sign out? Local data stays on this device.')) {
      await signOut();
      location.reload();
    }
  });
}

boot();

// Expose `supabase` only for debugging in dev. Unused in prod code paths.
if (import.meta.env.DEV) window.__sb = supabase;
