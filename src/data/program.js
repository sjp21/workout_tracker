// Home equipment: two adjustable dumbbells of different makes, an adjustable
// bench, and a doorway pull-up bar.
//   DB A — 5 lb steps, max 55 lb
//   DB B — 2.5 lb steps, max 52.5 lb
// A matched pair can only move in 5 lb steps (DB A sets the pace) and tops out
// at 50 lb each (the heaviest load both can hit). A one-dumbbell lift can use DB B's
// 2.5 lb steps all the way up, then DB A for 55.
export const LOADS = {
  pair: { increment: 5, maxWeight: 50, label: '2 DBs' },
  single: { increment: 2.5, maxWeight: 55, label: '1 DB' },
  bw: { increment: 0, maxWeight: 0, label: 'bodyweight' }
};

// Every exercise declares how it is loaded; increment and maxWeight come from
// LOADS so progression can never suggest a weight the dumbbells can't make.
// capRepHigh: the rep target once the load ceiling is reached (load-equivalence
// meta: 30–85% 1RM grows muscle equally when sets end near failure).
// harder: the variation to switch to once capRepHigh is hit at the ceiling.
// easier: optional regression offered when the bottom of the range is missed.
function ex(def) {
  const load = LOADS[def.load];
  return { ...def, increment: load.increment, maxWeight: load.maxWeight };
}

export const PROGRAM = [
  {
    id: 'd1', name: 'Upper A', focus: 'Chest · Back · Shoulders',
    exercises: [
      ex({ id: 'incdbp1', name: 'Incline DB Press (15–30°)', tags: ['upper chest', 'compound'], load: 'pair', sets: 4, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 150, harder: '3-sec lowering + 1-sec pause on the chest' }),
      ex({ id: 'dbrow1', name: 'One-Arm DB Row', tags: ['back', 'compound'], load: 'single', sets: 4, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 120, harder: '2-sec squeeze at the top, 3-sec lowering' }),
      ex({ id: 'dbshp', name: 'Seated DB Shoulder Press', tags: ['shoulders', 'compound'], load: 'pair', sets: 3, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 120, harder: '1½ reps (bottom half, full rep = 1)' }),
      ex({ id: 'dbcsrow', name: 'Chest-Supported DB Row', tags: ['back', 'compound'], load: 'pair', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 120, harder: '2-sec squeeze at the top' }),
      ex({ id: 'dblat', name: 'DB Lateral Raise', tags: ['shoulders', 'isolation'], load: 'pair', sets: 3, repLow: 12, repHigh: 20, capRepHigh: 30, rest: 60, harder: 'lean-away one-arm raise' }),
      ex({ id: 'dbohtri', name: 'Overhead DB Tricep Extension', tags: ['triceps', 'isolation'], load: 'single', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 90, harder: '2-sec pause in the stretch' }),
      ex({ id: 'dbinccurl', name: 'DB Incline Curl', tags: ['biceps', 'long head'], load: 'pair', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 90, harder: '3-sec lowering' })
    ]
  },
  {
    id: 'd2', name: 'Lower A', focus: 'Quads · Hamstrings · Abs',
    exercises: [
      ex({ id: 'dbbss', name: 'DB Bulgarian Split Squat (per leg)', tags: ['quads', 'glutes'], load: 'pair', sets: 4, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 120, harder: '1½ reps (bottom half, full rep = 1)' }),
      ex({ id: 'dbrdl2', name: 'DB Romanian Deadlift', tags: ['hamstrings', 'posterior'], load: 'pair', sets: 3, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 120, harder: 'switch to single-leg RDL' }),
      ex({ id: 'dbgs', name: 'DB Goblet Squat', tags: ['quads', 'compound'], load: 'single', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 90, harder: 'heels elevated + 3-sec pause at the bottom' }),
      ex({ id: 'slidecurl', name: 'Slider Leg Curl (towel on smooth floor)', tags: ['hamstrings', 'isolation'], load: 'bw', sets: 3, repLow: 8, repHigh: 15, capRepHigh: 15, rest: 90, harder: 'single-leg slider curl' }),
      ex({ id: 'dbslcalf', name: 'Single-Leg DB Calf Raise (per leg)', tags: ['calves', 'isolation'], load: 'single', sets: 3, repLow: 12, repHigh: 20, capRepHigh: 30, rest: 60, harder: '2-sec pause in the stretch' }),
      ex({ id: 'dbcrunch', name: 'DB Weighted Crunch', tags: ['core', 'isolation'], load: 'single', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 60, harder: 'crunch on the bench set to decline' })
    ]
  },
  {
    id: 'd3', name: 'Upper B', focus: 'Chest · Back · Arms',
    exercises: [
      ex({ id: 'flatdbp', name: 'Flat DB Press', tags: ['chest', 'compound'], load: 'pair', sets: 4, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 150, harder: '3-sec lowering + 1-sec pause on the chest' }),
      ex({ id: 'pullup', name: 'Pull-Up', tags: ['lats', 'compound'], load: 'bw', sets: 3, repLow: 5, repHigh: 12, capRepHigh: 12, rest: 150, harder: 'weighted pull-up: hold a DB between your feet', easier: 'negatives: jump to the top, lower over 3–5 sec' }),
      ex({ id: 'incdbfly', name: 'Incline DB Fly', tags: ['chest', 'isolation'], load: 'pair', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 90, harder: '2-sec pause in the stretch' }),
      ex({ id: 'dblat2', name: 'DB Lateral Raise', tags: ['shoulders', 'isolation'], load: 'pair', sets: 3, repLow: 12, repHigh: 20, capRepHigh: 30, rest: 60, harder: 'lean-away one-arm raise' }),
      ex({ id: 'dbcurl1', name: 'DB Curl', tags: ['biceps', 'isolation'], load: 'pair', sets: 3, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 90, harder: '3-sec lowering' }),
      ex({ id: 'dbskull', name: 'DB Skull Crushers', tags: ['triceps', 'isolation'], load: 'pair', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 90, harder: 'lower behind the head for a deeper stretch' }),
      ex({ id: 'dbcrunch2', name: 'DB Weighted Crunch', tags: ['core', 'isolation'], load: 'single', sets: 3, repLow: 10, repHigh: 15, capRepHigh: 25, rest: 60, harder: 'crunch on the bench set to decline' })
    ]
  },
  {
    id: 'd4', name: 'Lower B', focus: 'Glutes · Hamstrings · Quads · Abs',
    exercises: [
      ex({ id: 'dbrevlunge', name: 'DB Reverse Lunge (per leg)', tags: ['glutes', 'quads'], load: 'pair', sets: 4, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 120, harder: 'front foot on a 2–4" plate or step (deficit)' }),
      ex({ id: 'dbslrdl', name: 'DB Single-Leg RDL (per leg)', tags: ['hamstrings', 'glutes'], load: 'pair', sets: 3, repLow: 8, repHigh: 12, capRepHigh: 20, rest: 120, harder: '3-sec lowering' }),
      ex({ id: 'dbhipthrust', name: 'DB Hip Thrust (back on bench)', tags: ['glutes', 'compound'], load: 'single', sets: 3, repLow: 10, repHigh: 20, capRepHigh: 30, rest: 90, harder: 'single-leg hip thrust' }),
      ex({ id: 'dbgsheel', name: 'Heels-Elevated Goblet Squat', tags: ['quads', 'isolation'], load: 'single', sets: 3, repLow: 12, repHigh: 20, capRepHigh: 30, rest: 90, harder: '1½ reps (bottom half, full rep = 1)' }),
      ex({ id: 'dbslcalf2', name: 'Single-Leg DB Calf Raise (per leg)', tags: ['calves', 'isolation'], load: 'single', sets: 3, repLow: 12, repHigh: 20, capRepHigh: 30, rest: 60, harder: '2-sec pause in the stretch' }),
      ex({ id: 'hanglegraise', name: 'Hanging Leg Raise', tags: ['core', 'lower abs'], load: 'bw', sets: 3, repLow: 8, repHigh: 15, capRepHigh: 15, rest: 60, harder: 'straight legs, toes to the bar', easier: 'hanging knee raise' })
    ]
  }
];

// Primary-mover credit per exercise. Each exercise contributes its sets to exactly
// one muscle group on the weekly-volume strip. Choices made on the muscle the
// movement most clearly loads with the heaviest mechanical tension.
export const PRIMARY_MUSCLE = {
  // Upper A
  incdbp1: 'chest',
  dbrow1: 'back',
  dbshp: 'shoulders',
  dbcsrow: 'back',
  dblat: 'shoulders',
  dbohtri: 'triceps',
  dbinccurl: 'biceps',
  // Lower A
  dbbss: 'quads',
  dbrdl2: 'hamstrings',
  dbgs: 'quads',
  slidecurl: 'hamstrings',
  dbslcalf: 'calves',
  dbcrunch: 'core',
  // Upper B
  flatdbp: 'chest',
  pullup: 'back',
  incdbfly: 'chest',
  dblat2: 'shoulders',
  dbcurl1: 'biceps',
  dbskull: 'triceps',
  dbcrunch2: 'core',
  // Lower B
  dbrevlunge: 'glutes',
  dbslrdl: 'hamstrings',
  dbhipthrust: 'glutes',
  dbgsheel: 'quads',
  dbslcalf2: 'calves',
  hanglegraise: 'core'
};

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core'
];
