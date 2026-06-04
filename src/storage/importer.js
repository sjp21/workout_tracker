// One-time importer from localStorage['hypertrophy-lab-v1'] → IndexedDB.
// Guarded by localStorage['hypertrophy-lab-imported'] so a wipe-and-reinstall
// doesn't clobber fresh cloud state with stale local. The original
// localStorage key is intentionally NOT deleted — it's the user's last-resort
// fallback in case the import was wrong somehow.

import { CURRENT_SCHEMA } from './migrations.js';

const LEGACY_KEY = 'hypertrophy-lab-v1';
const MARKER = 'hypertrophy-lab-imported';

export function shouldImport() {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem(MARKER)) return false;
  return !!localStorage.getItem(LEGACY_KEY);
}

export function markImported() {
  localStorage.setItem(MARKER, new Date().toISOString());
}

export function readLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Lift the legacy localStorage payload into the new app_state shape. New
// fields introduced by v1 (bodyweight, uiState, dirty) get sensible defaults.
export function legacyToState(legacy) {
  if (!legacy || typeof legacy !== 'object') return null;
  return {
    schemaVersion: CURRENT_SCHEMA,
    mode: 'today',
    currentDayIdx: legacy.currentDayIdx ?? 0,
    history: legacy.history ?? {},
    currentSession: legacy.currentSession ?? {},
    profile: legacy.profile ?? null,
    foodLog: legacy.foodLog ?? {},
    bodyweight: [],
    uiState: { openFoodCategories: ['Protein'] },
    dirty: true,
    lastSyncedAt: null
  };
}
