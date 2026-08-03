// Migration registry: ordered transforms from prior schemaVersion → next.
// Day-1 baseline is schemaVersion: 1. Each entry runs against state at its
// source version and returns the state at version + 1.
//
// To add a migration: append { from: N, to: N+1, run(state) { ... } }.
// `to` must always equal `from + 1`. Versions must be contiguous.

export const CURRENT_SCHEMA = 2;

// Default cardio block (schemaVersion 2). weeklyTargetMin is engine-managed
// but user-overridable; targetHistory is the engine's append-only weekly
// { week, target } ledger (see src/lib/cardio.js rollTargets).
export function defaultCardio() {
  return {
    weeklyTargetMin: 60,
    vigorousUnlocked: false,
    targetHistory: [],
    sessions: []
  };
}

export const MIGRATIONS = [
  {
    from: 1,
    to: 2,
    run(state) {
      return { ...state, cardio: defaultCardio() };
    }
  }
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
    cardio: defaultCardio(),
    uiState: { openFoodCategories: ['Protein'] },
    dirty: false,
    lastSyncedAt: null
  };
}
