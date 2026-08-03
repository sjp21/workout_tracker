import { describe, it, expect } from 'vitest';
import { migrate, defaultState, CURRENT_SCHEMA, MIGRATIONS } from './migrations.js';

describe('migrations', () => {
  it('defaultState carries CURRENT_SCHEMA', () => {
    expect(defaultState().schemaVersion).toBe(CURRENT_SCHEMA);
  });

  it('migrate is identity at CURRENT_SCHEMA', () => {
    const s = defaultState();
    expect(migrate(s)).toEqual(s);
  });

  it('migrate returns null on garbage', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate(undefined)).toBeNull();
  });

  it('v1 → v2 adds the default cardio block and preserves the rest', () => {
    const v1 = { ...defaultState(), schemaVersion: 1, history: { dbBench: [{ date: '2026-06-01', sets: [] }] } };
    delete v1.cardio;
    const out = migrate(v1);
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA);
    expect(out.cardio).toEqual({
      weeklyTargetMin: 60,
      vigorousUnlocked: false,
      targetHistory: [],
      sessions: []
    });
    expect(out.history.dbBench).toHaveLength(1);
  });

  it('migration steps are contiguous (from + 1 === to)', () => {
    MIGRATIONS.forEach((m) => expect(m.to).toBe(m.from + 1));
  });

  it('migration "from" values are unique', () => {
    const froms = MIGRATIONS.map((m) => m.from);
    expect(new Set(froms).size).toBe(froms.length);
  });
});
