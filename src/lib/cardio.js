import { mondayOf } from './volume.js';

// Cardio progression engine. Currency is weekly zone-2 minutes (Mon-anchored,
// same calendar convention as the volume strip), intensity anchored to
// RPE/talk-test — no HR hardware. History in → suggestion + cited rationale
// out, mirroring progression.js. No DOM.
//
// Ramp rules (WHO 2020 / ACSM progression):
// - Completed last week's target with ≥3 sessions → +10%, capped at 300 min/wk.
// - ≥50% of target → hold. No streak language, no shame copy.
// - <50% → step one rung back down the ramp.
// - ≥3 sessions required for "completed" — minutes can't pile into one mega-walk.
// - After ≥2 consecutive completed weeks at ≥150 min, offer (never force) one
//   vigorous 4×4 session (Helgerud 2007).

export const RAMP_CAP = 300; // WHO 2020 upper band, min/wk
export const WHO_FLOOR = 150; // WHO 2020 lower band, min/wk
export const SESSION_FLOOR = 3; // sessions/wk for a week to count as completed

const RAMP_BOTTOM = 30; // step-back never drops below one short walk per week

export function addDays(ymd, n) {
  const d = new Date(ymd + 'T12:00:00'); // noon dodges DST edges
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Total minutes + session count for the Mon-anchored week starting `weekStart`.
export function weekStats(sessions, weekStart) {
  let minutes = 0;
  let count = 0;
  for (const s of sessions || []) {
    if (!s.date || mondayOf(s.date) !== weekStart) continue;
    minutes += s.minutes || 0;
    count += 1;
  }
  return { minutes, count };
}

const round5 = (n) => Math.round(n / 5) * 5;

// +10% rounded to 5 min, but always at least +5 so low targets don't stall.
export function stepUp(target) {
  return Math.min(RAMP_CAP, Math.max(target + 5, round5(target * 1.1)));
}

// One rung back down the same ramp.
export function stepDown(target) {
  return Math.max(RAMP_BOTTOM, Math.min(target - 5, round5(target / 1.1)));
}

// 'completed' | 'hold' | 'back' for one week's stats against its target.
export function evaluateWeek(stats, target) {
  if (stats.minutes >= target && stats.count >= SESSION_FLOOR) return 'completed';
  if (stats.minutes >= target * 0.5) return 'hold';
  return 'back';
}

// Roll the target ledger forward to the week containing `referenceDate`.
// targetHistory is the engine's append-only [{ week, target }] record — its
// last entry marks the week the current target applies to, and the full list
// powers the target-vs-actual history view. Pure: returns a patch, mutates
// nothing. Multi-week gaps are folded one week at a time, so an absent
// fortnight steps back twice rather than being silently forgiven.
export function rollTargets(cardio, referenceDate = new Date()) {
  const thisWeek = mondayOf(referenceDate);
  const history = (cardio.targetHistory || []).slice();
  let target = cardio.weeklyTargetMin; // user-overridable; trust it over history
  let changed = false;

  if (history.length === 0) {
    history.push({ week: thisWeek, target });
    changed = true;
  }
  let week = history[history.length - 1].week;
  while (week < thisWeek) {
    const verdict = evaluateWeek(weekStats(cardio.sessions, week), target);
    if (verdict === 'completed') target = stepUp(target);
    else if (verdict === 'back') target = stepDown(target);
    week = addDays(week, 7);
    history.push({ week, target });
    changed = true;
  }
  return { weeklyTargetMin: target, targetHistory: history, changed };
}

// Message explaining the current week's target, recomputed from the ledger —
// shown on the Today card all week, same pattern as lifting's suggestNext.
export function suggestWeek(cardio, referenceDate = new Date()) {
  const thisWeek = mondayOf(referenceDate);
  const history = cardio.targetHistory || [];
  const idx = history.findIndex((e) => e.week === thisWeek);
  if (idx === -1) return null;
  const cur = history[idx];
  const prev = idx > 0 ? history[idx - 1] : null;

  if (!prev) {
    return {
      action: 'first',
      target: cur.target,
      message: `Starting target: ${cur.target} min across ${SESSION_FLOOR}+ sessions at a talk-test pace (you can speak full sentences). WHO 2020 recommends building toward 150–300 min/wk of moderate activity — the first win is consistency, not volume.`
    };
  }

  const stats = weekStats(cardio.sessions, prev.week);
  const verdict = evaluateWeek(stats, prev.target);

  if (verdict === 'completed') {
    if (cur.target === prev.target) {
      return {
        action: 'cap',
        target: cur.target,
        message: `→ Holding at ${cur.target} min — the WHO 2020 upper band (300 min/wk moderate). More volume isn't the lever from here.`
      };
    }
    return {
      action: 'up',
      target: cur.target,
      message: `↑ ${cur.target} min this week (+10%). You logged ${stats.minutes} min across ${stats.count} sessions last week. ACSM progression: raise duration and frequency before intensity; WHO 2020 band is 150–300 min/wk.`
    };
  }
  if (verdict === 'hold') {
    // Frequency floor: minutes were there but piled into too few sessions.
    if (stats.minutes >= prev.target && stats.count < SESSION_FLOOR) {
      return {
        action: 'hold',
        target: cur.target,
        message: `→ Holding at ${cur.target} min. You hit the minutes (${stats.minutes}) but in ${stats.count} session${stats.count === 1 ? '' : 's'} — spread it across ${SESSION_FLOOR}+ to progress (ACSM: frequency before intensity).`
      };
    }
    return {
      action: 'hold',
      target: cur.target,
      message: `→ Holding at ${cur.target} min. You logged ${stats.minutes} of ${prev.target} min last week — same target again, per ACSM guidance to progress only from a consistent base.`
    };
  }
  return {
    action: 'down',
    target: cur.target,
    message: `↓ ${cur.target} min this week (one step back from ${prev.target}). Last week came in at ${stats.minutes} min — a smaller target you'll actually hit beats a bigger one you won't (ACSM progression).`
  };
}

// Offer the 4×4 vigorous swap after ≥2 consecutive completed weeks at ≥150
// min/wk (counting back from last week). Offered, never forced; once accepted
// (vigorousUnlocked) the offer retires.
export function vigorousOffer(cardio, referenceDate = new Date()) {
  if (cardio.vigorousUnlocked) return false;
  const thisWeek = mondayOf(referenceDate);
  let streak = 0;
  let week = addDays(thisWeek, -7);
  for (;;) {
    const stats = weekStats(cardio.sessions, week);
    if (stats.minutes < WHO_FLOOR || stats.count < SESSION_FLOOR) break;
    streak += 1;
    week = addDays(week, -7);
  }
  return streak >= 2;
}

export const VIGOROUS_OFFER_COPY =
  `You've held 150+ min/wk for 2+ straight weeks. Optional: swap one session for 4×4 intervals — 4 × 4 min hard (can't speak full sentences) with 3 min easy between. Helgerud 2007 showed this is the lever that moves VO₂max. Entirely your call; the weekly target doesn't change.`;

// Personal mood correlation from the one-tap "mood after" row. Reported as
// the user's own logged pattern, never as a biological mechanism — the acute
// human dopamine literature doesn't support mechanism claims.
export function feltBetterRate(sessions) {
  const rated = (sessions || []).filter((s) => s.mood);
  if (rated.length < 5) return null;
  const better = rated.filter((s) => s.mood === 'better' || s.mood === 'much_better').length;
  return { pct: Math.round((100 * better) / rated.length), n: rated.length };
}
