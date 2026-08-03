import { describe, it, expect } from 'vitest';
import {
  weekStats,
  stepUp,
  stepDown,
  evaluateWeek,
  rollTargets,
  suggestWeek,
  vigorousOffer,
  feltBetterRate,
  addDays,
  RAMP_CAP,
  WHO_FLOOR
} from './cardio.js';
import { mondayOf } from './volume.js';

// All dates below are Mon-anchored around a fixed reference week.
const MON = mondayOf('2026-06-10'); // Monday of the test "current" week
const prevMon = (n) => addDays(MON, -7 * n);

// n sessions of `min` minutes spread across the week starting `weekStart`
function week(weekStart, mins) {
  return mins.map((minutes, i) => ({ date: addDays(weekStart, i % 7), minutes, rpe: 3 }));
}

function cardioState(overrides = {}) {
  return {
    weeklyTargetMin: 60,
    vigorousUnlocked: false,
    targetHistory: [],
    sessions: [],
    ...overrides
  };
}

describe('weekStats', () => {
  it('sums minutes and counts sessions for the given week only', () => {
    const sessions = [...week(MON, [20, 25]), ...week(prevMon(1), [30])];
    expect(weekStats(sessions, MON)).toEqual({ minutes: 45, count: 2 });
    expect(weekStats(sessions, prevMon(1))).toEqual({ minutes: 30, count: 1 });
  });

  it('handles empty / missing sessions', () => {
    expect(weekStats([], MON)).toEqual({ minutes: 0, count: 0 });
    expect(weekStats(undefined, MON)).toEqual({ minutes: 0, count: 0 });
  });
});

describe('ramp steps', () => {
  it('steps up +10% rounded to 5, minimum +5', () => {
    expect(stepUp(60)).toBe(65);
    expect(stepUp(100)).toBe(110);
    expect(stepUp(20)).toBe(25); // 10% would stall at the rounding floor
  });

  it('caps at the WHO 2020 upper band', () => {
    expect(stepUp(295)).toBe(RAMP_CAP);
    expect(stepUp(RAMP_CAP)).toBe(RAMP_CAP);
  });

  it('steps down one rung with a 30-min floor', () => {
    expect(stepDown(65)).toBe(60);
    expect(stepDown(60)).toBe(55);
    expect(stepDown(30)).toBe(30);
    expect(stepDown(35)).toBe(30);
  });

  it('reaches the WHO floor from 60 in roughly 9–10 completed weeks', () => {
    let t = 60;
    let weeks = 0;
    while (t < WHO_FLOOR) {
      t = stepUp(t);
      weeks++;
    }
    expect(weeks).toBeGreaterThanOrEqual(9);
    expect(weeks).toBeLessThanOrEqual(11);
  });
});

describe('evaluateWeek', () => {
  it('completed: target minutes met across >=3 sessions', () => {
    expect(evaluateWeek({ minutes: 60, count: 3 }, 60)).toBe('completed');
  });

  it('frequency floor: target minutes in <3 sessions is NOT completed', () => {
    expect(evaluateWeek({ minutes: 90, count: 1 }, 60)).toBe('hold');
    expect(evaluateWeek({ minutes: 60, count: 2 }, 60)).toBe('hold');
  });

  it('hold at >=50% of target', () => {
    expect(evaluateWeek({ minutes: 30, count: 2 }, 60)).toBe('hold');
  });

  it('step back below 50%', () => {
    expect(evaluateWeek({ minutes: 29, count: 1 }, 60)).toBe('back');
    expect(evaluateWeek({ minutes: 0, count: 0 }, 60)).toBe('back');
  });
});

describe('rollTargets', () => {
  it('first roll stamps the current week without changing the target', () => {
    const roll = rollTargets(cardioState(), MON);
    expect(roll.changed).toBe(true);
    expect(roll.weeklyTargetMin).toBe(60);
    expect(roll.targetHistory).toEqual([{ week: MON, target: 60 }]);
  });

  it('is idempotent within the same week', () => {
    const c = cardioState({ targetHistory: [{ week: MON, target: 60 }] });
    const roll = rollTargets(c, MON);
    expect(roll.changed).toBe(false);
    expect(roll.targetHistory).toHaveLength(1);
  });

  it('ramps +10% after a completed week', () => {
    const c = cardioState({
      targetHistory: [{ week: prevMon(1), target: 60 }],
      sessions: week(prevMon(1), [20, 20, 25])
    });
    const roll = rollTargets(c, MON);
    expect(roll.weeklyTargetMin).toBe(65);
    expect(roll.targetHistory).toEqual([
      { week: prevMon(1), target: 60 },
      { week: MON, target: 65 }
    ]);
  });

  it('holds on a partial week (>=50%)', () => {
    const c = cardioState({
      targetHistory: [{ week: prevMon(1), target: 60 }],
      sessions: week(prevMon(1), [20, 15])
    });
    expect(rollTargets(c, MON).weeklyTargetMin).toBe(60);
  });

  it('steps back below 50%', () => {
    const c = cardioState({
      targetHistory: [{ week: prevMon(1), target: 60 }],
      sessions: week(prevMon(1), [20])
    });
    expect(rollTargets(c, MON).weeklyTargetMin).toBe(55);
  });

  it('folds multi-week gaps one week at a time', () => {
    const c = cardioState({ targetHistory: [{ week: prevMon(2), target: 60 }] });
    const roll = rollTargets(c, MON);
    // Two empty weeks → two step-backs: 60 → 55 → 50
    expect(roll.weeklyTargetMin).toBe(50);
    expect(roll.targetHistory).toHaveLength(3);
  });

  it('respects a user override of weeklyTargetMin over the ledger', () => {
    const c = cardioState({
      weeklyTargetMin: 100, // user bumped it mid-week
      targetHistory: [{ week: prevMon(1), target: 60 }],
      sessions: week(prevMon(1), [40, 40, 40])
    });
    expect(rollTargets(c, MON).weeklyTargetMin).toBe(110);
  });
});

describe('suggestWeek', () => {
  it('returns null when the ledger has no entry for this week', () => {
    expect(suggestWeek(cardioState(), MON)).toBeNull();
  });

  it('first week gets a starting message citing WHO 2020', () => {
    const c = cardioState({ targetHistory: [{ week: MON, target: 60 }] });
    const s = suggestWeek(c, MON);
    expect(s.action).toBe('first');
    expect(s.message).toContain('WHO 2020');
  });

  it('ramp-up message cites ACSM progression', () => {
    const c = cardioState({
      targetHistory: [{ week: prevMon(1), target: 60 }, { week: MON, target: 65 }],
      sessions: week(prevMon(1), [20, 20, 25])
    });
    const s = suggestWeek(c, MON);
    expect(s.action).toBe('up');
    expect(s.target).toBe(65);
    expect(s.message).toContain('ACSM');
  });

  it('frequency-floor hold names the session spread, not the minutes', () => {
    const c = cardioState({
      targetHistory: [{ week: prevMon(1), target: 60 }, { week: MON, target: 60 }],
      sessions: week(prevMon(1), [70])
    });
    const s = suggestWeek(c, MON);
    expect(s.action).toBe('hold');
    expect(s.message).toContain('spread');
  });

  it('step-back message has no shame copy', () => {
    const c = cardioState({
      targetHistory: [{ week: prevMon(1), target: 60 }, { week: MON, target: 55 }],
      sessions: week(prevMon(1), [10])
    });
    const s = suggestWeek(c, MON);
    expect(s.action).toBe('down');
    expect(s.message.toLowerCase()).not.toContain('streak');
    expect(s.message.toLowerCase()).not.toContain('fail');
  });

  it('cap message appears when completed at 300', () => {
    const c = cardioState({
      targetHistory: [{ week: prevMon(1), target: 300 }, { week: MON, target: 300 }],
      sessions: week(prevMon(1), [100, 100, 100])
    });
    const s = suggestWeek(c, MON);
    expect(s.action).toBe('cap');
    expect(s.message).toContain('300');
  });
});

describe('vigorousOffer', () => {
  const completed150 = (weekStart) => week(weekStart, [50, 50, 55]);

  it('fires after 2 consecutive completed weeks at >=150 min', () => {
    const c = cardioState({
      sessions: [...completed150(prevMon(2)), ...completed150(prevMon(1))]
    });
    expect(vigorousOffer(c, MON)).toBe(true);
  });

  it('does not fire after only 1 such week', () => {
    const c = cardioState({ sessions: completed150(prevMon(1)) });
    expect(vigorousOffer(c, MON)).toBe(false);
  });

  it('requires the weeks to be consecutive up to last week', () => {
    const c = cardioState({
      sessions: [...completed150(prevMon(3)), ...completed150(prevMon(2))]
    });
    expect(vigorousOffer(c, MON)).toBe(false);
  });

  it('150 min in under 3 sessions does not count', () => {
    const c = cardioState({
      sessions: [...week(prevMon(2), [80, 80]), ...week(prevMon(1), [80, 80])]
    });
    expect(vigorousOffer(c, MON)).toBe(false);
  });

  it('retires once unlocked', () => {
    const c = cardioState({
      vigorousUnlocked: true,
      sessions: [...completed150(prevMon(2)), ...completed150(prevMon(1))]
    });
    expect(vigorousOffer(c, MON)).toBe(false);
  });
});

describe('feltBetterRate', () => {
  it('needs at least 5 rated sessions', () => {
    const sessions = [
      { date: MON, minutes: 20, mood: 'better' },
      { date: MON, minutes: 20, mood: 'same' },
      { date: MON, minutes: 20 } // unrated doesn't count
    ];
    expect(feltBetterRate(sessions)).toBeNull();
  });

  it('counts better + much_better against all rated', () => {
    const moods = ['better', 'much_better', 'same', 'better', 'worse'];
    const sessions = moods.map((mood) => ({ date: MON, minutes: 20, mood }));
    expect(feltBetterRate(sessions)).toEqual({ pct: 60, n: 5 });
  });
});
