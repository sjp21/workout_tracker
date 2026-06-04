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

  it('migration steps are contiguous (from + 1 === to)', () => {
    MIGRATIONS.forEach((m) => expect(m.to).toBe(m.from + 1));
  });

  it('migration "from" values are unique', () => {
    const froms = MIGRATIONS.map((m) => m.from);
    expect(new Set(froms).size).toBe(froms.length);
  });
});
