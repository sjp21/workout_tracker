import { describe, it, expect } from 'vitest';
import { mondayOf, weeklyVolume, volumeStatus } from './volume.js';

describe('volume', () => {
  it('mondayOf returns Monday for a Wednesday', () => {
    expect(mondayOf('2026-05-27')).toBe('2026-05-25'); // 5/27 is Wed → 5/25 Mon
  });

  it('mondayOf returns same day for a Monday', () => {
    expect(mondayOf('2026-05-25')).toBe('2026-05-25');
  });

  it('mondayOf for a Sunday returns previous Monday', () => {
    expect(mondayOf('2026-05-31')).toBe('2026-05-25');
  });

  it('weeklyVolume credits primary muscle for completed sets in this week', () => {
    const history = {
      incdbp1: [
        {
          date: '2026-05-26',
          sets: [
            { done: true, reps: 8 },
            { done: true, reps: 8 },
            { done: false, reps: 0 }
          ]
        }
      ]
    };
    const v = weeklyVolume(history, new Date('2026-05-28T12:00:00'));
    expect(v.chest).toBe(2);
  });

  it('weeklyVolume excludes sessions outside the calendar week', () => {
    const history = {
      incdbp1: [
        { date: '2026-05-18', sets: [{ done: true, reps: 8 }] }, // previous week
        { date: '2026-05-26', sets: [{ done: true, reps: 8 }] }
      ]
    };
    const v = weeklyVolume(history, new Date('2026-05-28T12:00:00'));
    expect(v.chest).toBe(1);
  });

  it('weeklyVolume handles exercises without a primary muscle mapping', () => {
    const history = { unknown: [{ date: '2026-05-26', sets: [{ done: true, reps: 8 }] }] };
    const v = weeklyVolume(history, new Date('2026-05-28T12:00:00'));
    for (const m of Object.keys(v)) expect(v[m]).toBe(0);
  });

  it('volumeStatus buckets per Schoenfeld 2017', () => {
    expect(volumeStatus(0)).toBe('none');
    expect(volumeStatus(3)).toBe('low');
    expect(volumeStatus(8)).toBe('mid');
    expect(volumeStatus(10)).toBe('hit');
    expect(volumeStatus(15)).toBe('hit');
  });
});
