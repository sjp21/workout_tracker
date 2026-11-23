import { describe, it, expect } from 'vitest';
import { suggestNext, snapWeight, STALE_DAYS } from './progression.js';
import { PROGRAM, PRIMARY_MUSCLE, MUSCLE_GROUPS, LOADS } from '../data/program.js';

const TODAY = new Date('2026-11-23T12:00:00');
const RECENT = '2026-11-20';

const pair = { id: 'p', load: 'pair', increment: 5, maxWeight: 50, repLow: 8, repHigh: 12, capRepHigh: 20, harder: '1½ reps' };
const single = { id: 's', load: 'single', increment: 2.5, maxWeight: 55, repLow: 10, repHigh: 15, capRepHigh: 25 };
const bw = { id: 'b', load: 'bw', increment: 0, maxWeight: 0, repLow: 10, repHigh: 20, capRepHigh: 20, harder: 'hold a DB' };

const session = (weight, reps, rir = 2, date = RECENT) => [
  { date, sets: reps.map((r) => ({ weight, reps: r, rir: String(rir), done: true })) }
];

describe('suggestNext', () => {
  it('first session prompts for a starting weight', () => {
    expect(suggestNext(pair, [], TODAY).action).toBe('first');
  });

  it('pair lifts go up in 5 lb steps', () => {
    const s = suggestNext(pair, session(30, [12, 12, 12]), TODAY);
    expect(s).toMatchObject({ action: 'up', weight: 35 });
  });

  it('single-DB lifts go up in 2.5 lb steps', () => {
    const s = suggestNext(single, session(30, [15, 15, 15]), TODAY);
    expect(s).toMatchObject({ action: 'up', weight: 32.5 });
  });

  it('never suggests more than the dumbbells make', () => {
    expect(suggestNext(single, session(52.5, [15, 15, 15]), TODAY).weight).toBe(55);
    const s = suggestNext(pair, session(50, [12, 12, 12]), TODAY);
    expect(s.weight).toBe(50);
    expect(s.action).toBe('hold');
  });

  it('at the ceiling the rep target extends to capRepHigh', () => {
    const s = suggestNext(pair, session(50, [14, 13, 12]), TODAY);
    expect(s.action).toBe('hold');
    expect(s.weight).toBe(50);
    expect(s.message).toContain('20');
  });

  it('maxing capRepHigh at the ceiling points to the harder variation', () => {
    const s = suggestNext(pair, session(50, [20, 20, 21]), TODAY);
    expect(s.action).toBe('cap');
    expect(s.weight).toBe(50);
    expect(s.message).toContain('1½ reps');
  });

  it('snaps odd legacy weights onto the pair grid', () => {
    expect(suggestNext(pair, session(22.5, [12, 12, 12]), TODAY).weight).toBe(25);
    expect(snapWeight(37.5, pair)).toBe(35);
    expect(snapWeight(60, single)).toBe(55);
  });

  it('deload lands on a weight the pair can make', () => {
    const s = suggestNext(pair, session(45, [6, 5, 7]), TODAY);
    expect(s).toMatchObject({ action: 'down', weight: 40 });
  });

  it('bodyweight lifts progress by reps, then variation', () => {
    expect(suggestNext(bw, session('', [15, 14, 12]), TODAY)).toMatchObject({ action: 'hold', weight: null });
    const s = suggestNext(bw, session('', [20, 20, 20]), TODAY);
    expect(s.action).toBe('cap');
    expect(s.message).toContain('hold a DB');
  });

  it('bodyweight misses offer the exercise-specific regression', () => {
    const pull = { ...bw, repLow: 5, repHigh: 12, capRepHigh: 12, easier: 'negatives' };
    const s = suggestNext(pull, session('', [3, 2, 4]), TODAY);
    expect(s.action).toBe('down');
    expect(s.message).toContain('negatives');
  });

  it('eases back in after a long layoff', () => {
    const old = new Date(TODAY);
    old.setDate(old.getDate() - (STALE_DAYS + 70));
    const date = old.toISOString().slice(0, 10);
    const s = suggestNext(pair, session(40, [12, 12, 12], 2, date), TODAY);
    expect(s).toMatchObject({ action: 'restart', weight: 35 });
  });
});

describe('program', () => {
  const all = PROGRAM.flatMap((d) => d.exercises);

  it('has unique exercise IDs', () => {
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
  });

  it('every exercise is dumbbell-or-bodyweight with a credited muscle', () => {
    for (const e of all) {
      expect(LOADS[e.load], e.id).toBeDefined();
      expect(e.increment).toBe(LOADS[e.load].increment);
      expect(MUSCLE_GROUPS).toContain(PRIMARY_MUSCLE[e.id]);
      expect(e.capRepHigh).toBeGreaterThanOrEqual(e.repHigh);
    }
  });

  it('PRIMARY_MUSCLE has no stale entries', () => {
    expect(Object.keys(PRIMARY_MUSCLE).sort()).toEqual(all.map((e) => e.id).sort());
  });

  it('trains every leg muscle twice a week', () => {
    for (const m of ['quads', 'hamstrings', 'calves', 'core']) {
      const days = PROGRAM.filter((d) => d.exercises.some((e) => PRIMARY_MUSCLE[e.id] === m));
      expect(days.length, m).toBeGreaterThanOrEqual(2);
    }
  });
});
