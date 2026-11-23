# Home Dumbbell Program — Locked Spec

Replaces the full-gym program (`e6fa5c2`). Back to home equipment. Goals: leg
muscle, upper-body muscle, more visible abs.

## Equipment

| Item | Steps | Max |
|---|---|---|
| DB A | 5 lb | 55 lb |
| DB B | 2.5 lb | 52.5 lb |
| Adjustable bench | flat / incline | — |
| Doorway pull-up bar | — | — |

- **Two-dumbbell lifts (`pair`)** move in 5 lb steps (DB A sets the pace) and top
  out at **50 lb each**, the heaviest weight both can make.
- **One-dumbbell lifts (`single`)** use DB B's 2.5 lb steps, then DB A for **55 lb**.
- **Bodyweight (`bw`)** lifts progress by reps, then by variation.

`LOADS` in `src/data/program.js` holds these numbers. Each exercise declares a
`load`, and `increment`/`maxWeight` come from it, so the app never suggests a weight
the dumbbells can't make.

## Progression at a hard ceiling

Normal double progression below the ceiling. At the ceiling (and always for
bodyweight lifts), the rep target extends from `repHigh` to `capRepHigh` (20–30). Hitting
`capRepHigh` on every set brings up the exercise's `harder` variation (tempo,
pause, 1½ reps, single-leg). Log it under the same lift and restart at `repLow`.
This rests on Schoenfeld 2017's load meta-analysis (30–85% 1RM is equivalent
near failure), which `evidence.js` already cites. No new claims.

Other rules:
- Weight suggestions are rounded down to the load's step size (`snapWeight`), so
  odd legacy weights land on achievable numbers.
- **Layoff rule:** if an exercise's last session is more than 28 days old, the app
  suggests starting ~10% lighter (`restart`). This matters now because the reused
  dumbbell IDs carry history from before August.

## Split

Upper/Lower ×2 replaces Push/Pull/Legs/Upper. Legs had been trained about once a week
(plus an RDL on Pull). Now every leg muscle gets two sessions. Day IDs stay
`d1`–`d4`, so the rotation cursor survives with no migration.

### Upper A (d1) — Chest · Back · Shoulders
| Exercise | Load | Sets×Reps (cap) | Rest |
|---|---|---|---|
| Incline DB Press (15–30°) | pair | 4×8–12 (20) | 150 |
| One-Arm DB Row | single | 4×8–12 (20) | 120 |
| Seated DB Shoulder Press | pair | 3×8–12 (20) | 120 |
| Chest-Supported DB Row | pair | 3×10–15 (25) | 120 |
| DB Lateral Raise | pair | 3×12–20 (30) | 60 |
| Overhead DB Tricep Extension | single | 3×10–15 (25) | 90 |
| DB Incline Curl | pair | 3×10–15 (25) | 90 |

### Lower A (d2) — Quads · Hamstrings · Abs
| Exercise | Load | Sets×Reps (cap) | Rest |
|---|---|---|---|
| DB Bulgarian Split Squat | pair | 4×8–12/leg (20) | 120 |
| DB Romanian Deadlift | pair | 3×8–12 (20) | 120 |
| DB Goblet Squat | single | 3×10–15 (25) | 90 |
| Slider Leg Curl | bw | 3×8–15 | 90 |
| Single-Leg DB Calf Raise | single | 3×12–20/leg (30) | 60 |
| DB Weighted Crunch | single | 3×10–15 (25) | 60 |

### Upper B (d3) — Chest · Back · Arms
| Exercise | Load | Sets×Reps (cap) | Rest |
|---|---|---|---|
| Flat DB Press | pair | 4×8–12 (20) | 150 |
| Pull-Up | bw | 3×5–12 | 150 |
| Incline DB Fly | pair | 3×10–15 (25) | 90 |
| DB Lateral Raise | pair | 3×12–20 (30) | 60 |
| DB Curl | pair | 3×8–12 (20) | 90 |
| DB Skull Crushers | pair | 3×10–15 (25) | 90 |
| DB Weighted Crunch | single | 3×10–15 (25) | 60 |

### Lower B (d4) — Glutes · Hamstrings · Quads · Abs
| Exercise | Load | Sets×Reps (cap) | Rest |
|---|---|---|---|
| DB Reverse Lunge | pair | 4×8–12/leg (20) | 120 |
| DB Single-Leg RDL | pair | 3×8–12/leg (20) | 120 |
| DB Hip Thrust (back on bench) | single | 3×10–20 (30) | 90 |
| Heels-Elevated Goblet Squat | single | 3×12–20 (30) | 90 |
| Single-Leg DB Calf Raise | single | 3×12–20/leg (30) | 60 |
| Hanging Leg Raise | bw | 3×8–15 | 60 |

Exercise choice: under a 50 lb cap, unilateral lower-body lifts (split squat, lunge,
single-leg RDL, single-leg calf raise) roughly double the load per leg. They are
the main leg builders. Slider curls cover knee flexion without a machine.

## Weekly volume (direct sets, primary-mover credit)

| Muscle | Sets/wk |
|---|---|
| Chest | 11 |
| Back | 10 |
| Shoulders | 9 |
| Quads | 10 |
| Hamstrings | 9 |
| Core | 9 |
| Glutes | 7 (+ split squats, RDLs) |
| Calves | 6 |
| Biceps | 6 (+ rows) |
| Triceps | 6 (+ pressing) |

`glutes` was added to `MUSCLE_GROUPS`. It is credited by the reverse lunge and hip thrust.

## Abs

Direct ab work is now 3 sessions/week, loaded where possible so it progresses like
any other muscle. How visible abs are depends mostly on body fat, so the Fuel
tab's deficit target does most of the work there.

## IDs and history

Dumbbell lifts identical to the pre-gym program keep their original IDs and history
(`incdbp1`, `flatdbp`, `incdbfly`, `dbshp`, `dblat`, `dbohtri`, `dbskull`,
`dbrow1`, `dbcsrow`, `dbcurl1`, `dbinccurl`, `dbbss`, `dbrdl2`, `dbgs`, `dbcrunch`).
New lifts get new IDs. Gym-only history (`bbbench`, `hexdl`, …) stays in storage.
It no longer appears in the program or the History modal.

## Pull-up bar

Pull-ups fill the one real gap in a dumbbell-only setup: vertical pulling. They
replace Upper B's second one-arm row. Hanging leg raises replace the bench reverse
crunch. Both are bodyweight lifts. They progress by reps, then go to the `harder` version
(weighted pull-up with a DB between the feet; toes-to-bar). If you miss the bottom of the
range, the app offers the `easier` version instead (negatives; hanging knee raise).
