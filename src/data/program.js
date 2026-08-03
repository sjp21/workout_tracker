export const PROGRAM = [
  {
    id: 'd1', name: 'Push', focus: 'Chest · Shoulders · Triceps',
    exercises: [
      { id: 'bbbench', name: 'Barbell Bench Press', tags: ['chest', 'compound'], sets: 4, repLow: 6, repHigh: 10, increment: 5, rest: 180 },
      { id: 'incdbp1', name: 'Incline DB Press (15–30°)', tags: ['upper chest', 'compound'], sets: 4, repLow: 8, repHigh: 12, increment: 5, rest: 150 },
      { id: 'incdbfly', name: 'Incline DB Fly', tags: ['chest', 'isolation'], sets: 3, repLow: 10, repHigh: 15, increment: 2.5, rest: 90 },
      { id: 'dbshp', name: 'Seated DB Shoulder Press', tags: ['shoulders', 'compound'], sets: 3, repLow: 8, repHigh: 12, increment: 5, rest: 150 },
      { id: 'dblat', name: 'DB Lateral Raise', tags: ['shoulders', 'isolation'], sets: 3, repLow: 12, repHigh: 20, increment: 2.5, rest: 60 },
      { id: 'ohcext', name: 'Overhead Cable Extension', tags: ['triceps', 'isolation'], sets: 3, repLow: 10, repHigh: 12, increment: 5, rest: 90 },
      { id: 'ezskull', name: 'EZ-Bar Skull Crushers', tags: ['triceps', 'isolation'], sets: 3, repLow: 10, repHigh: 12, increment: 5, rest: 90 }
    ]
  },
  {
    id: 'd2', name: 'Pull', focus: 'Back · Biceps · Posterior Chain',
    exercises: [
      { id: 'hexdl', name: 'Hex Bar Deadlift', tags: ['posterior', 'compound'], sets: 4, repLow: 5, repHigh: 8, increment: 10, rest: 180 },
      { id: 'latpd', name: 'Lat Pulldown', tags: ['back', 'compound'], sets: 4, repLow: 8, repHigh: 12, increment: 5, rest: 120 },
      { id: 'cablerow', name: 'Seated Cable Row', tags: ['back', 'compound'], sets: 3, repLow: 10, repHigh: 12, increment: 5, rest: 120 },
      { id: 'dbcurl1', name: 'DB Curl', tags: ['biceps', 'isolation'], sets: 3, repLow: 8, repHigh: 12, increment: 2.5, rest: 90 },
      { id: 'dbinccurl', name: 'DB Incline Curl', tags: ['biceps', 'long head'], sets: 5, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 }
    ]
  },
  {
    id: 'd3', name: 'Legs', focus: 'Quads · Hams · Glutes · Core',
    exercises: [
      { id: 'bbsquat', name: 'Barbell Back Squat', tags: ['quads', 'compound'], sets: 4, repLow: 6, repHigh: 10, increment: 10, rest: 180 },
      { id: 'legpress', name: 'Leg Press', tags: ['quads', 'compound'], sets: 3, repLow: 10, repHigh: 12, increment: 10, rest: 120 },
      { id: 'dbbss', name: 'DB Bulgarian Split Squat', tags: ['quads', 'glutes'], sets: 3, repLow: 8, repHigh: 10, increment: 2.5, rest: 120 },
      { id: 'bbrdl', name: 'Barbell RDL', tags: ['hamstrings', 'posterior'], sets: 4, repLow: 8, repHigh: 10, increment: 5, rest: 180 },
      { id: 'machcalf', name: 'Standing Calf Raise (machine)', tags: ['calves', 'isolation'], sets: 3, repLow: 15, repHigh: 20, increment: 5, rest: 60 },
      { id: 'dbcrunch', name: 'DB Weighted Crunch', tags: ['core', 'isolation'], sets: 3, repLow: 10, repHigh: 15, increment: 2.5, rest: 60 }
    ]
  },
  {
    id: 'd4', name: 'Upper', focus: 'Chest + Arms Emphasis',
    exercises: [
      { id: 'incdbp2', name: 'Incline DB Press', tags: ['upper chest', 'compound'], sets: 4, repLow: 8, repHigh: 12, increment: 5, rest: 150 },
      { id: 'flatfly', name: 'Flat DB Fly', tags: ['chest', 'isolation'], sets: 3, repLow: 10, repHigh: 15, increment: 2.5, rest: 90 },
      { id: 'cgbench', name: 'Close-Grip Barbell Bench', tags: ['triceps', 'chest'], sets: 3, repLow: 8, repHigh: 12, increment: 5, rest: 120 },
      { id: 'db21', name: 'DB Curl 21s', tags: ['biceps', 'isolation'], sets: 3, repLow: 21, repHigh: 21, increment: 2.5, rest: 90 },
      { id: 'ohcext2', name: 'Overhead Cable Extension', tags: ['triceps', 'isolation'], sets: 3, repLow: 10, repHigh: 12, increment: 5, rest: 90 },
      { id: 'dbinccurl2', name: 'DB Incline Curl', tags: ['biceps', 'long head'], sets: 3, repLow: 10, repHigh: 12, increment: 2.5, rest: 90 }
    ]
  }
];

// Primary-mover credit per exercise. Each exercise contributes its sets to exactly
// one muscle group on the weekly-volume strip. Choices made on the muscle the
// movement most clearly loads with the heaviest mechanical tension.
export const PRIMARY_MUSCLE = {
  // Push day
  bbbench: 'chest',
  incdbp1: 'chest',
  incdbfly: 'chest',
  dbshp: 'shoulders',
  dblat: 'shoulders',
  ohcext: 'triceps',
  ezskull: 'triceps',
  // Pull day
  hexdl: 'hamstrings',
  latpd: 'back',
  cablerow: 'back',
  dbcurl1: 'biceps',
  dbinccurl: 'biceps',
  // Legs day
  bbsquat: 'quads',
  legpress: 'quads',
  dbbss: 'quads',
  bbrdl: 'hamstrings',
  machcalf: 'calves',
  dbcrunch: 'core',
  // Upper day
  incdbp2: 'chest',
  flatfly: 'chest',
  cgbench: 'triceps',
  db21: 'biceps',
  ohcext2: 'triceps',
  dbinccurl2: 'biceps'
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
