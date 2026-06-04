export const PROGRAM = [
  {
    id: 'd1', name: 'Push', focus: 'Chest · Shoulders · Triceps',
    exercises: [
      { id: 'incdbp1', name: 'Incline DB Press (15–30°)', tags: ['upper chest', 'compound'], sets: 4, repLow: 6, repHigh: 10, increment: 5, rest: 180 },
      { id: 'flatdbp', name: 'Flat DB Press', tags: ['chest', 'compound'], sets: 3, repLow: 8, repHigh: 12, increment: 5, rest: 150 },
      { id: 'incdbfly', name: 'Incline DB Fly', tags: ['chest', 'isolation'], sets: 3, repLow: 10, repHigh: 15, increment: 2.5, rest: 90 },
      { id: 'dbshp', name: 'Seated DB Shoulder Press', tags: ['shoulders', 'compound'], sets: 3, repLow: 8, repHigh: 12, increment: 5, rest: 150 },
      { id: 'dblat', name: 'DB Lateral Raise', tags: ['shoulders', 'isolation'], sets: 3, repLow: 12, repHigh: 20, increment: 2.5, rest: 60 },
      { id: 'dbohtri', name: 'Overhead DB Tricep Extension', tags: ['triceps', 'isolation'], sets: 3, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 },
      { id: 'dbskull', name: 'DB Skull Crushers', tags: ['triceps', 'isolation'], sets: 3, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 }
    ]
  },
  {
    id: 'd2', name: 'Pull', focus: 'Back · Biceps · Posterior Chain',
    exercises: [
      { id: 'dbrow1', name: 'One-Arm DB Row', tags: ['back', 'compound'], sets: 4, repLow: 8, repHigh: 12, increment: 5, rest: 150 },
      { id: 'dbcsrow', name: 'Chest-Supported DB Row', tags: ['back', 'compound'], sets: 3, repLow: 10, repHigh: 12, increment: 5, rest: 120 },
      { id: 'dbpull', name: 'DB Pullover', tags: ['lats', 'chest'], sets: 3, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 },
      { id: 'dbrdl1', name: 'DB Romanian Deadlift', tags: ['hamstrings', 'posterior'], sets: 3, repLow: 8, repHigh: 10, increment: 5, rest: 150 },
      { id: 'dbcurl1', name: 'DB Curl', tags: ['biceps', 'isolation'], sets: 3, repLow: 8, repHigh: 12, increment: 2.5, rest: 90 },
      { id: 'dbinccurl', name: 'DB Incline Curl', tags: ['biceps', 'long head'], sets: 5, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 }
    ]
  },
  {
    id: 'd3', name: 'Legs', focus: 'Quads · Hams · Glutes · Core',
    exercises: [
      { id: 'dbgs', name: 'DB Goblet Squat', tags: ['quads', 'compound'], sets: 4, repLow: 10, repHigh: 12, increment: 5, rest: 150 },
      { id: 'dbbss', name: 'DB Bulgarian Split Squat', tags: ['quads', 'glutes'], sets: 3, repLow: 8, repHigh: 10, increment: 2.5, rest: 120 },
      { id: 'dbrdl2', name: 'DB Romanian Deadlift', tags: ['hamstrings', 'posterior'], sets: 4, repLow: 8, repHigh: 10, increment: 5, rest: 150 },
      { id: 'dblunge', name: 'DB Walking Lunge', tags: ['quads', 'glutes'], sets: 3, repLow: 10, repHigh: 10, increment: 2.5, rest: 120 },
      { id: 'dbcalf', name: 'DB Calf Raise', tags: ['calves', 'isolation'], sets: 3, repLow: 15, repHigh: 20, increment: 2.5, rest: 60 },
      { id: 'hangleg', name: 'Hanging Leg Raise / Plank', tags: ['core'], sets: 3, repLow: 10, repHigh: 15, increment: 0, rest: 60 }
    ]
  },
  {
    id: 'd4', name: 'Upper', focus: 'Chest + Arms Emphasis',
    exercises: [
      { id: 'incdbp2', name: 'Incline DB Press', tags: ['upper chest', 'compound'], sets: 4, repLow: 8, repHigh: 12, increment: 5, rest: 150 },
      { id: 'flatfly', name: 'Flat DB Fly', tags: ['chest', 'isolation'], sets: 3, repLow: 10, repHigh: 15, increment: 2.5, rest: 90 },
      { id: 'dbfp', name: 'DB Floor Press (slow)', tags: ['chest', 'triceps'], sets: 3, repLow: 6, repHigh: 10, increment: 5, rest: 150 },
      { id: 'db21', name: 'DB Curl 21s', tags: ['biceps', 'isolation'], sets: 3, repLow: 21, repHigh: 21, increment: 2.5, rest: 90 },
      { id: 'cgdbp', name: 'Close-Grip DB Press', tags: ['triceps', 'chest'], sets: 3, repLow: 8, repHigh: 12, increment: 5, rest: 120 },
      { id: 'dbinccurl2', name: 'DB Incline Curl', tags: ['biceps', 'long head'], sets: 3, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 },
      { id: 'dbohtri2', name: 'Overhead DB Tricep Extension', tags: ['triceps', 'isolation'], sets: 3, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 }
    ]
  }
];

// Primary-mover credit per exercise. Each exercise contributes its sets to exactly
// one muscle group on the weekly-volume strip. Choices made on the muscle the
// movement most clearly loads with the heaviest mechanical tension.
export const PRIMARY_MUSCLE = {
  // Push day
  incdbp1: 'chest',
  flatdbp: 'chest',
  incdbfly: 'chest',
  dbshp: 'shoulders',
  dblat: 'shoulders',
  dbohtri: 'triceps',
  dbskull: 'triceps',
  // Pull day
  dbrow1: 'back',
  dbcsrow: 'back',
  dbpull: 'back',
  dbrdl1: 'hamstrings',
  dbcurl1: 'biceps',
  dbinccurl: 'biceps',
  // Legs day
  dbgs: 'quads',
  dbbss: 'quads',
  dbrdl2: 'hamstrings',
  dblunge: 'quads',
  dbcalf: 'calves',
  hangleg: 'core',
  // Upper day
  incdbp2: 'chest',
  flatfly: 'chest',
  dbfp: 'chest',
  db21: 'biceps',
  cgdbp: 'triceps',
  dbinccurl2: 'biceps',
  dbohtri2: 'triceps'
};

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'calves',
  'core'
];
