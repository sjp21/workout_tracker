import { describe, it, expect } from 'vitest';
import { nextDayIdx } from './rotation.js';

describe('nextDayIdx', () => {
  it('advances to the next day in sequence', () => {
    expect(nextDayIdx(0, 4)).toBe(1);
    expect(nextDayIdx(1, 4)).toBe(2);
    expect(nextDayIdx(2, 4)).toBe(3);
  });

  it('wraps from the last day back to the first', () => {
    expect(nextDayIdx(3, 4)).toBe(0);
  });
});
