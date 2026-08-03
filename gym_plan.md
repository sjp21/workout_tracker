# Gym Program Redesign — Locked Spec

Redesign of the 4-day dumbbell program for a full commercial gym. Emphasis: chest,
biceps, triceps, upper legs. Priority lifts: barbell bench press, barbell back squat,
hex bar deadlift. Bicep work carried over untouched by explicit instruction.

Decided via full design interview on 2026-08-03. Every prescription below is covered
by the existing meta-analyses in `src/data/evidence.js` (volume dose-response,
frequency, load equivalence 30–85% 1RM, RIR 1–3, rest intervals) — the redesign makes
no new scientific claims. Barbell/cable swaps are justified on practical grounds
(finer load increments, no setup limit, cleaner progression), not evidence grounds.

## Structural decisions

- **Skeleton unchanged:** 4-day Push / Pull / Legs / Upper. Frequency meta
  (Schoenfeld 2019) shows split shape is irrelevant at equated volume; the current
  skeleton already delivers 2×/week for every emphasized muscle.
- **Deadlift anchors Pull day** (slot 1, fresh). It is a pull — hips, hams, glutes,
  erectors, traps, grip. Never shares a session with squats. **Hex bar** over
  conventional: shifts load toward quads (upper-leg emphasis), easier on the lower
  back, faster to get technically solid. Sub conventional when the hex bar is taken;
  log under the same exercise.
- **Bench anchors Push day**, incline DB press moves to slot 2. Flat DB press retired
  (bench replaces the flat pressing pattern). Incline-first emphasis preserved on
  Upper day.
- **Back squat anchors Legs day**, goblet squat retired (it was a no-rack workaround).
- **Double-RDL redundancy resolved:** old program had RDLs on Pull and Legs day. The
  deadlift takes the Pull slot; Legs keeps a single barbell RDL. Hamstrings still 2×/wk.
- **First vertical pull in the program:** lat pulldown (a home dumbbell setup can't do
  one; the DB pullover was its workaround and is retired). Both DB rows collapse into
  a seated cable row.
- **Scheduling note (calendar habit, not code):** Pull (d2) and Legs (d3) both load
  the lower back — put a rest day between them when the week allows.

## Program

Format: Exercise — sets×reps (increment lb, rest s). "unchanged" = carried over
verbatim from the current program, same exercise ID, history preserved.

### Push (d1) — Chest · Shoulders · Triceps

| Exercise | Prescription |
|---|---|
| Barbell Bench Press | 4×6–10 (5, 180) — new |
| Incline DB Press | 4×8–12 — unchanged (`incdbp1`) |
| Incline DB Fly | 3×10–15 — unchanged (`incdbfly`) |
| Seated DB Shoulder Press | 3×8–12 — unchanged (`dbshp`) |
| DB Lateral Raise | 3×12–20 — unchanged (`dblat`) |
| Overhead Cable Extension | 3×10–12 (5, 90) — new |
| EZ-Bar Skull Crushers | 3×10–12 (5, 90) — new |

### Pull (d2) — Back · Biceps · Posterior Chain

| Exercise | Prescription |
|---|---|
| Hex Bar Deadlift | 4×5–8 (10, 180) — new |
| Lat Pulldown | 4×8–12 (5, 120) — new |
| Seated Cable Row | 3×10–12 (5, 120) — new |
| DB Curl | 3×8–12 — unchanged (`dbcurl1`) |
| DB Incline Curl | 5×10–12 — unchanged (`dbinccurl`) |

### Legs (d3) — Quads · Hams · Glutes · Core

| Exercise | Prescription |
|---|---|
| Barbell Back Squat | 4×6–10 (10, 180) — new |
| Leg Press | 3×10–12 (10, 120) — new |
| DB Bulgarian Split Squat | 3×8–10 — unchanged (`dbbss`) |
| Barbell RDL | 4×8–10 (5, 180) — new |
| Standing Calf Raise (machine) | 3×15–20 (5, 60) — new |
| DB Weighted Crunch | 3×10–15 — unchanged (`dbcrunch`) |

### Upper (d4) — Chest + Arms Emphasis

| Exercise | Prescription |
|---|---|
| Incline DB Press | 4×8–12 — unchanged (`incdbp2`) |
| Flat DB Fly | 3×10–15 — unchanged (`flatfly`) |
| Close-Grip Barbell Bench | 3×8–12 (5, 120) — new (merges floor press + close-grip DB press) |
| DB Curl 21s | 3×21 — unchanged (`db21`) |
| Overhead Cable Extension | 3×10–12 (5, 90) — new |
| DB Incline Curl | 3×10–12 — unchanged (`dbinccurl2`) |

## Weekly volume (direct sets)

| Muscle | Sets/wk | Status |
|---|---|---|
| Chest | ~21 | emphasized — above 10+ target |
| Biceps | 14 | emphasized |
| Triceps | 12 (+ heavy pressing overlap) | emphasized |
| Quads | 10 | emphasized |
| Hamstrings | 8 (incl. deadlift) | emphasized |
| Back | ~7 direct + deadlift isometric | maintenance |
| Shoulders | 6 | maintenance |
| Calves | 3 | maintenance |
| Core | 3 | maintenance |

## Implementation decisions

- Changes confined to `PROGRAM` and `PRIMARY_MUSCLE` in `src/data/program.js`.
- **New IDs for every changed lift; IDs kept only where the exercise is literally
  identical** (the eleven "unchanged" rows above). New lifts start fresh with the
  existing first-session prompt ("pick a weight at the low end with 2–3 RIR") —
  correct behavior for learning new barbell lifts. No history mapping: old dumbbell
  weights don't translate to barbell loads, and seeded suggestions would be
  confidently wrong.
- Orphaned history for retired exercises stays in storage — harmless, synced,
  recoverable.
- **No schema migration.** Day IDs stay d1–d4, so rotation/sequence state survives.
- `evidence.js` and `MUSCLE_GROUPS` untouched.
