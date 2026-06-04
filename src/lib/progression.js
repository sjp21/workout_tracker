// Double-progression model (Schoenfeld 2017 dose-response):
// - Hit top of rep range across ALL sets with RIR ≤ 2 → +increment
// - Hit somewhere in range → hold weight, push reps
// - Missed bottom on 2+ sets → deload ~10%
export function suggestNext(exercise, exHistory) {
  const hist = exHistory || [];
  if (hist.length === 0) {
    return {
      weight: null,
      action: 'first',
      message:
        'First session — pick a weight where you hit the LOW end of the rep range with 2–3 reps in reserve.'
    };
  }
  const last = hist[hist.length - 1];
  const sets = last.sets.filter((s) => s.done && s.reps > 0);
  if (sets.length === 0) return { weight: null, action: 'first', message: 'No completed sets logged. Start fresh.' };

  const allHitTop = sets.every((s) => s.reps >= exercise.repHigh);
  const avgRir = sets.reduce((a, s) => a + (parseInt(s.rir) || 0), 0) / sets.length;
  const missedBottom = sets.filter((s) => s.reps < exercise.repLow).length;
  const lastWeight = sets[0].weight;

  if (allHitTop && avgRir <= 2) {
    return {
      weight: lastWeight + exercise.increment,
      action: 'up',
      message: `↑ +${exercise.increment} lb. You completed all sets at the top of the rep range (${exercise.repHigh}) with RIR ${avgRir.toFixed(1)}. Per Schoenfeld's dose-response data, progressive overload is the primary driver of continued hypertrophy.`
    };
  }
  if (missedBottom >= 2) {
    return {
      weight: Math.max(exercise.increment, Math.round((lastWeight * 0.9) / exercise.increment) * exercise.increment),
      action: 'down',
      message: `↓ Deload ~10%. You missed the bottom of the rep range (${exercise.repLow}) on multiple sets. Refalo 2022 confirms RIR 1–3 work matches failure for growth with less burnout.`
    };
  }
  return {
    weight: lastWeight,
    action: 'hold',
    message: `→ Hold weight, push reps. Aim for ${exercise.repHigh} on all sets before adding load.`
  };
}
