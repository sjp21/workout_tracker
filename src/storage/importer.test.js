import { describe, it, expect, beforeEach } from 'vitest';
import { shouldImport, markImported, readLegacy, legacyToState } from './importer.js';
import { CURRENT_SCHEMA } from './migrations.js';

beforeEach(() => {
  localStorage.clear();
});

describe('importer', () => {
  it('shouldImport is false when no legacy data', () => {
    expect(shouldImport()).toBe(false);
  });

  it('shouldImport is true when legacy data exists and no marker', () => {
    localStorage.setItem('hypertrophy-lab-v1', '{}');
    expect(shouldImport()).toBe(true);
  });

  it('shouldImport is false once marker is set', () => {
    localStorage.setItem('hypertrophy-lab-v1', '{}');
    markImported();
    expect(shouldImport()).toBe(false);
  });

  it('readLegacy parses the legacy JSON', () => {
    localStorage.setItem('hypertrophy-lab-v1', '{"profile":{"weightLb":180}}');
    expect(readLegacy()).toEqual({ profile: { weightLb: 180 } });
  });

  it('readLegacy returns null on bad JSON', () => {
    localStorage.setItem('hypertrophy-lab-v1', 'not json');
    expect(readLegacy()).toBeNull();
  });

  it('legacyToState fills in v1 defaults', () => {
    const out = legacyToState({ profile: { weightLb: 180 }, history: { foo: [] } });
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA);
    expect(out.profile).toEqual({ weightLb: 180 });
    expect(out.bodyweight).toEqual([]);
    expect(out.uiState.openFoodCategories).toContain('Protein');
    expect(out.dirty).toBe(true);
  });
});
