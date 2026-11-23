// Double progression with a hard load ceiling (home dumbbells):
// - Below the ceiling: hit the top of the rep range on ALL sets with RIR ≤ 2
//   → +increment (clamped to the heaviest weight the dumbbells make).
// - At the ceiling: weight can't rise, so reps are the overload. The rep target
//   extends to capRepHigh (Schoenfeld 2017 load meta: 30–85% 1RM grows muscle
//   equally near failure). Hit capRepHigh on all sets → switch to `harder`.
// - Bodyweight lifts (increment 0) live permanently "at the ceiling".
// - Missed the bottom of the range on 2+ sets → deload ~10%.
// - Last session more than STALE_DAYS ago → ease back in ~10% lighter.

export const STALE_DAYS = 28;
const DAY_MS = 24 * 60 * 60 * 1000;

// Round down to a weight the dumbbells can actually make for this lift.
export function snapWeight(weight, exercise) {
  const inc = exercise.increment;
  if (!inc) return 0;
  const snapped = Math.floor(weight / inc + 1e-9) * inc;
  const capped = exercise.maxWeight ? Math.min(snapped, exercise.maxWeight) : snapped;
  return Math.max(inc, capped);
}

function daysBetween(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(toDate);
  to.setHours(0, 0, 0, 0);
  return Math.round((to - from) / DAY_MS);
}

export function suggestNext(exercise, exHistory, today = new Date()) {
  const hist = exHistory || [];
  const bodyweight = !exercise.increment;
  const capReps = exercise.capRepHigh || exercise.repHigh;

  if (hist.length === 0) {
    return {
      weight: null,
      action: 'first',
      message: bodyweight
        ? 'First session — bodyweight lift. Leave weight blank and stop each set with 2–3 reps in reserve.'
        : 'First session — pick a weight where you hit the LOW end of the rep range with 2–3 reps in reserve.'
    };
  }
  const last = hist[hist.length - 1];
  const sets = last.sets.filter((s) => s.done && s.reps > 0);
  if (sets.length === 0) return { weight: null, action: 'first', message: 'No completed sets logged. Start fresh.' };

  const lastWeight = bodyweight ? null : Math.max(...sets.map((s) => Number(s.weight) || 0));

  if (last.date) {
    const gap = daysBetween(last.date, today);
    if (gap > STALE_DAYS) {
      const weeks = Math.round(gap / 7);
      return {
        weight: bodyweight ? null : snapWeight(lastWeight * 0.9, exercise),
        action: 'restart',
        message: bodyweight
          ? `↺ ${weeks} weeks since you last did this. Stop each set 2–3 reps short of failure for the first week, then progress as normal.`
          : `↺ ${weeks} weeks since you last did this (${lastWeight} lb). Start ~10% lighter with 2–3 reps in reserve; strength comes back quickly, so expect to climb back within a few sessions.`
      };
    }
  }

  const atCeiling = bodyweight || lastWeight >= exercise.maxWeight;
  const target = atCeiling ? capReps : exercise.repHigh;
  const allHitTop = sets.every((s) => s.reps >= target);
  const avgRir = sets.reduce((a, s) => a + (parseInt(s.rir) || 0), 0) / sets.length;
  const missedBottom = sets.filter((s) => s.reps < exercise.repLow).length;
  const harder = exercise.harder ? ` Next step: ${exercise.harder}.` : '';

  if (allHitTop && avgRir <= 2) {
    if (!atCeiling) {
      const next = snapWeight(lastWeight + exercise.increment, exercise);
      return {
        weight: next,
        action: 'up',
        message: `↑ +${next - lastWeight} lb. You completed all sets at the top of the rep range (${exercise.repHigh}) with RIR ${avgRir.toFixed(1)}. Per Schoenfeld's dose-response data, progressive overload is the primary driver of continued hypertrophy.`
      };
    }
    return {
      weight: lastWeight,
      action: 'cap',
      message: bodyweight
        ? `⤒ ${target}+ reps on every set — this version is too easy now.${harder} Log it under this lift and restart at the bottom of the rep range.`
        : `⤒ ${target}+ reps on every set at the ${exercise.maxWeight}-lb ceiling — reps have nowhere left to go.${harder} Keep the weight, log it under this lift, and restart at the bottom of the rep range.`
    };
  }
  if (missedBottom >= 2) {
    return {
      weight: bodyweight ? null : snapWeight(lastWeight * 0.9, exercise),
      action: 'down',
      message: bodyweight
        ? `↓ You missed the bottom of the rep range (${exercise.repLow}) on multiple sets. Use an easier version (${exercise.easier || 'shorter range or both legs'}) until you can hit ${exercise.repLow}.`
        : `↓ Deload ~10%. You missed the bottom of the rep range (${exercise.repLow}) on multiple sets. Refalo 2022 confirms RIR 1–3 work matches failure for growth with less burnout.`
    };
  }
  if (atCeiling && !bodyweight) {
    return {
      weight: lastWeight,
      action: 'hold',
      message: `→ At the ${exercise.maxWeight}-lb ceiling, so reps are your overload now. Build toward ${target} on every set (RIR 0–2) — loads down to ~30% 1RM grow muscle just as well when sets end near failure.`
    };
  }
  return {
    weight: lastWeight,
    action: 'hold',
    message: `→ ${bodyweight ? 'Same version' : 'Hold weight'}, push reps. Aim for ${target} on all sets before ${bodyweight ? 'making it harder' : 'adding load'}.`
  };
}
