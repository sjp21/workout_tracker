import { readState, writeState } from './indexeddb.js';
import { migrate, defaultState, CURRENT_SCHEMA } from './migrations.js';

// Storage interface: load, save, migrate.
// Write-through: every save flushes to IndexedDB synchronously (await-style)
// and sets a dirty flag. A background flusher in src/sync/ picks up the flag
// and pushes to Supabase when online; clearing dirty on success.

export async function load() {
  const stored = await readState();
  if (!stored) return defaultState();
  return migrate(stored);
}

export async function save(state) {
  const next = { ...state, schemaVersion: CURRENT_SCHEMA, dirty: true };
  await writeState(next);
  return next;
}

// Mark state clean after a successful remote push. Reads, sets dirty=false,
// re-writes. Used by the sync flusher only.
export async function markClean(syncedAt) {
  const cur = await readState();
  if (!cur) return;
  await writeState({ ...cur, dirty: false, lastSyncedAt: syncedAt });
}

export { migrate, defaultState, CURRENT_SCHEMA };
