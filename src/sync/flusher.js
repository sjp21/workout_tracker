import { supabase, isConfigured } from './supabase.js';
import { markClean } from '../storage/index.js';

// Background dirty-flag flusher. Local-first: every mutation sets state.dirty
// via storage.save(). This module retries pushing the latest snapshot to
// Supabase whenever we come online or the tab returns to foreground.
//
// LAST-WRITE-WINS. Blob-per-user means each push fully supersedes the prior
// cloud copy. Safe for a single device; if a second device is ever introduced
// this design breaks — would need updated_at compare before push.

let pushing = false;
let pendingState = null;

// Sync-health reporting. We can't positively detect "Supabase project paused"
// (it just makes the request fail), so we surface "writes are failing while
// online" instead. One blip shouldn't alarm; require a couple of consecutive
// real errors. 'no-session'/'not-configured' are expected states, not failures.
const FAIL_THRESHOLD = 2;
let consecutiveFailures = 0;
let statusCb = null;

export function onSyncStatus(cb) {
  statusCb = cb;
}

function emit(status) {
  if (statusCb) statusCb(status);
}

export function queue(state) {
  pendingState = state;
  void tryPush();
}

// Returns { ok } on success, or { ok: false, reason } where reason is
// 'not-configured' | 'no-session' | 'error'.
async function pushOnce(state) {
  if (!isConfigured()) return { ok: false, reason: 'not-configured' };
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return { ok: false, reason: 'no-session' };
  const { error } = await supabase.from('user_state').upsert({
    user_id: user.id,
    schema_version: state.schemaVersion,
    state,
    updated_at: new Date().toISOString()
  });
  if (error) {
    console.warn('[sync] push failed', error.message);
    return { ok: false, reason: 'error', message: error.message };
  }
  return { ok: true };
}

async function tryPush() {
  if (pushing) return;
  if (!pendingState) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  pushing = true;
  const snapshot = pendingState;
  try {
    const result = await pushOnce(snapshot);
    if (result.ok) {
      consecutiveFailures = 0;
      emit({ status: 'ok' });
      if (pendingState === snapshot) {
        pendingState = null;
        await markClean(new Date().toISOString());
      }
    } else if (result.reason === 'error') {
      consecutiveFailures += 1;
      if (consecutiveFailures >= FAIL_THRESHOLD) {
        emit({ status: 'failing', message: result.message });
      }
    }
  } finally {
    pushing = false;
  }
}

export async function pullRemoteIntoState(state) {
  if (!isConfigured()) return state;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return state;
  const { data, error } = await supabase
    .from('user_state')
    .select('state, schema_version, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return state;
  return data.state;
}

export function startFlusher() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', tryPush);
  window.addEventListener('focus', tryPush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryPush();
  });
}
