import { PRIMARY_MUSCLE, MUSCLE_GROUPS } from '../data/program.js';

// Mon-anchored calendar week. Returns YYYY-MM-DD for the Monday of the week
// containing `date`. Used to bucket sets into weekly volume.
export function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day + 6) % 7; // days back to Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// Returns { muscle: setCount } for the calendar week of `referenceDate`.
// Primary-mover credit only: each completed set adds 1 to its exercise's
// primary muscle (PRIMARY_MUSCLE[exId]). Distributes nothing to synergists.
export function weeklyVolume(history, referenceDate = new Date()) {
  const weekStart = mondayOf(referenceDate);
  const counts = {};
  MUSCLE_GROUPS.forEach((m) => (counts[m] = 0));

  for (const exId of Object.keys(history)) {
    const muscle = PRIMARY_MUSCLE[exId];
    if (!muscle) continue;
    const sessions = history[exId];
    for (const session of sessions) {
      if (!session.date) continue;
      if (mondayOf(session.date) !== weekStart) continue;
      const doneSets = (session.sets || []).filter((s) => s.done).length;
      counts[muscle] += doneSets;
    }
  }
  return counts;
}

// Schoenfeld 2017 dose-response trends upward with weekly volume; 10+ sets/muscle/week
// is a practical target (its categorical 10+ result was a trend, not a hard threshold).
// The buckets below are an app heuristic, not boundaries the paper defined:
// <6 = under-stimulated; 6–9 = building; 10+ = on target.
export function volumeStatus(count) {
  if (count >= 10) return 'hit';
  if (count >= 6) return 'mid';
  if (count > 0) return 'low';
  return 'none';
}
