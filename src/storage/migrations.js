// Migration registry: ordered transforms from prior schemaVersion → next.
// Day-1 baseline is schemaVersion: 1. Each entry runs against state at its
// source version and returns the state at version + 1.
//
// To add a migration: append { from: N, to: N+1, run(state) { ... } }.
// `to` must always equal `from + 1`. Versions must be contiguous.

export const CURRENT_SCHEMA = 1;

export const MIGRATIONS = [
  // No migrations on day 1. The shape of `defaultState` IS schemaVersion 1.
];

export function migrate(state) {
  if (!state || typeof state !== 'object') return null;
  let v = state.schemaVersion ?? 0;
  let cur = state;
  while (v < CURRENT_SCHEMA) {
    const step = MIGRATIONS.find((m) => m.from === v);
    if (!step) {
      throw new Error(`No migration from schemaVersion ${v} → ${v + 1}`);
    }
    cur = step.run(cur);
    cur.schemaVersion = step.to;
    v = step.to;
  }
  return cur;
}

export function defaultState() {
  return {
    schemaVersion: CURRENT_SCHEMA,
    mode: 'today',
    currentDayIdx: 0,
    history: {},
    currentSession: {},
    profile: null,
    foodLog: {},
    bodyweight: [],
    uiState: { openFoodCategories: ['Protein'] },
    dirty: false,
    lastSyncedAt: null
  };
}
