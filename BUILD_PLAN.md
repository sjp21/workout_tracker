# Stimulus — Build Plan (v2)

Locked design contract from the grilling session. Supersedes `stimulus-feature-spec.md` for sequencing; the original spec remains the canonical reference for individual feature behavior.

User goal driving every decision: **hypertrophy + cut (recomp)**, lose lower-stomach fat, grow LBM. iPhone-only PWA, single user.

---

## Locked architecture

| Layer | Decision |
|---|---|
| Project shape | Vite + vanilla JS (no framework). Modules in `src/`. |
| Hosting | GitHub Pages from `gh-pages` branch via GitHub Actions on push to `main`. Free for public repo. |
| Backend | Supabase. Magic-link auth, single `user_state` table (blob-per-user), RLS, one Edge Function for nutrition-API proxy. |
| Local storage | IndexedDB with `schemaVersion` field. `storage` interface with `load`, `save`, `migrate`. Empty `migrate()` registry on day 1. |
| Sync model | Local-first. Blob-per-user means latest write supersedes all prior — so no queue. Writes set a `dirty` flag on `app_state`, fire-and-forget Supabase, clear on success. A single background flusher retries on online/foreground. Last-write-wins, **single device only**: if a second client is ever introduced this design breaks and needs an `updated_at` compare before push. |
| PWA fidelity | Tier 2: `vite-plugin-pwa` for service worker + manifest + icons. App shell cached for offline launch. Supabase calls not cached. Storage layer is write-through (every set/meal flushes to IndexedDB synchronously), so a mid-session SW reload never loses state. |
| Migration | One-time silent importer from `localStorage['hypertrophy-lab-v1']` → IndexedDB on first launch, guarded by `localStorage['hypertrophy-lab-imported']` marker so wipe-and-reinstall doesn't clobber fresh cloud state with stale local. Don't delete the original localStorage copy. |
| Backup escape hatch | One "Download backup JSON" button on profile screen. No import UI. |
| Auth | Supabase **email OTP (6-digit code)**, not magic link. Magic link breaks on iOS standalone PWAs: tapping the link in Mail opens Safari, not the installed PWA, so the session lands in the wrong context. OTP avoids the context split entirely. Email allowlist of one (`sjp452@gmail.com`) + RLS. |
| SW update | `vite-plugin-pwa` defaults. Auto-update on next visit; tiny "new version, tap to reload" toast if mid-session. Safe because storage is write-through. |
| CI | GitHub Actions PR-trigger job: lint + vitest. Push to `main` runs the same job, then deploys to `gh-pages` only on green. Enforces the "every PR keeps the live PWA working" rule. |

---

## Information architecture

**Three tabs.** Today (default landing), Train, Fuel.

**Today tab** — opens first, daily-glance view:
- Sleep card (Phase 3, hidden in MVP)
- Weekly bodyweight (single number, prompted Monday morning, quiet tile until logged)
- Creatine check (Phase 3, hidden in MVP)
- Training card → today's day from PROGRAM + sets done/total
- Fuel card → kcal + macros at-a-glance
- Weekly volume per muscle strip (8 muscles + core, primary-mover credit, Mon-anchored calendar week)
- Cardio card (Phase 3, hidden in MVP)

Each Today card has a **next action button**, not just inert status.

**Train tab** — existing functionality, preserved verbatim. Auto-progression, rest timer, per-exercise history all stay.

**Fuel tab** — existing Mifflin-St Jeor + Morton 2018 protein + Schoenfeld & Aragon per-meal logic preserved. Gets Feature 3 (collapsible food categories) in MVP.

---

## MVP scope (v1)

1. **Vite migration + test harness + CI.** No behavior change. Vitest configured, one smoke test green, GH Actions PR job runs lint + vitest. Verify the live PWA still works.
2. **Storage layer.** IndexedDB + `storage` interface (write-through) + Supabase wired + email-OTP auth + one-time `localStorage` importer with `imported` marker. Pure modules covered by vitest.
3. **Tier 2 PWA.** Manifest, icons (180/192/512 + maskable, plus `<link rel="apple-touch-icon">` in `<head>`), service worker, dirty-flag flusher.
4. **Today tab shell** as default landing. Existing Train + Fuel tabs preserved.
5. **Weekly bodyweight** card on Today.
6. **Weekly volume per muscle** strip on Today (8 muscles + core, primary-mover credit via a `PRIMARY_MUSCLE` constant in code).
7. **Feature 3 — collapsible food categories.** Default state: most-used category open. Auto-expand sections with search matches. Persist open/closed per-user. Uses `<details>`/`<summary>`.
8. **"Download backup JSON"** button on profile.
9. **Single-user lockdown** in Supabase auth + RLS.

That's the whole v1. Ship and use for a couple weeks before deciding on Phase 2 timing.

---

## Phase 2 (after MVP is durable and lived-in)

1. **Feature 2 — live food search.**
   - USDA FoodData Central primary + Open Food Facts fallback.
   - Single `searchFoods(query)` interface, server-side via Supabase Edge Function.
   - Debounce 300ms, min query length 3.
   - Normalize to `{ name, kcal, p, c, f, fiber, serving }` shape (note: **adds `fiber` field** — first real schema migration).
   - Cache hits in IndexedDB `custom_foods` collection. Frequently-used auto-promote to top of results.
   - USDA API key as Supabase Edge Function env var.
2. **Barcode scanner.** ZXing-js via `getUserMedia`. iOS 14.3+ in standalone PWA mode. Pipes barcode → OFF lookup → normalized food object → log.
3. **Feature 1 — recommender.** Per-meal protein floor as primary score driver. Calorie ceiling as constraint. Carb/fat balance as tiebreaker. Honest UX framing (see Honest Framing section below). 3 candidates max. Pure, unit-testable function.

---

## Phase 3 (only if used after Phase 2 ships)

- Sleep tracking (single number per day, surfaced on Today card)
- Creatine daily check (binary tap on Today)
- Cardio log (zone-2 sessions for the cut)
- Deload prompt at week 5–6 of mesocycle
- Per-exercise estimated-1RM sparkline (Epley)
- Web push notifications (training reminder, weigh-in reminder, missing-meal nudge — all opt-in, default off)

Do not pre-build any of these. Wait until they hurt by their absence.

---

## Honest framing (non-negotiable)

These are claims the app makes about itself. Get them right.

1. **The recommender is an adherence tool, not an evidence-backed intervention.** Daily macro targets are evidence-based (Morton 2018, Schoenfeld & Aragon 2018, Murphy 2022). The act of suggesting a food to close a gap is UX help, not a biological lever. Label suggestions accordingly:
   - When firing on protein floor: "Closes per-meal protein floor (Schoenfeld & Aragon 2018)."
   - When firing on calorie gap with balanced macros: "Fits remaining budget — convenience, not a hypertrophy lever."
2. **"Lower stomach fat" is not spot-reducible.** App should track the trend, never promise the spot. Visible lower-ab generally requires ~12% BF for men; it's the last fat to mobilize.
3. **No prescriptive / restriction language.** Never use "should" outside macro-math context. Never moralize about eating choices. If daily intake comes in below 80% of target kcal, the recommender stays silent — under-eating is a real risk on cut.
4. **No streak gamification.** Track adherence rates in History (e.g., "Hit protein 5/7 days this week"). Do not weaponize them. No flame emojis. No "you broke your streak."
5. **Progress photos (if ever added)** stay on-device, never uploaded. Metadata only in cloud.

---

## Data model

**Cloud (Supabase):**
```sql
create table user_state (
  user_id uuid primary key references auth.users(id),
  schema_version int not null,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
-- RLS: only row owner reads/writes
```

**Local (IndexedDB)**, single object store `app_state` keyed by `'main'`:
```js
{
  schemaVersion: 1,
  mode, currentDayIdx,
  history, currentSession, profile, foodLog,
  bodyweight: [ { date, lb } ],   // weekly entries
  uiState: { openFoodCategories: [...] },
  dirty: false,                    // set on every local mutation, cleared on successful push
  lastSyncedAt: null
}
```

`schemaVersion: 1` is the day-1 baseline. Migration #2 (Phase 2) adds `customFoods: []` and `fiber` field on food objects.

---

## Build order (granular)

```
v1.0  Vite scaffold + vitest + CI (lint/test)    <- 1 PR
v1.1  Storage interface + IndexedDB (write-thru) <- 1 PR
v1.2  Supabase + email-OTP + guarded importer    <- 1 PR
v1.3  PWA manifest + icons + service worker      <- 1 PR
v1.4  Today tab shell (default landing)          <- 1 PR
v1.5  Bodyweight card + weekly volume strip      <- 1 PR
v1.6  Feature 3 (collapsible food list)          <- 1 PR
v1.7  Download backup button                     <- 1 PR
-------------- MVP LIVE; use for 2 weeks --------------
v2.0  Edge Function + USDA + OFF + searchFoods   <- 1 PR
v2.1  Custom-food cache + auto-promote           <- 1 PR
v2.2  Barcode scanner                            <- 1 PR
v2.3  Recommender (per-meal floor + ceiling)     <- 1 PR
```

Each PR keeps the live PWA working. No multi-PR migrations.

---

## Known open questions

- **What constant for the "expected pace" trend line** once we have ≥4 weekly weigh-ins. Targeting ~0.5–1% bodyweight/week loss; exact threshold for "off pace" needs tuning after a few weeks of data.
- **`PRIMARY_MUSCLE` map** for all 26 exercises needs to be authored (5 min of work, but a real decision per exercise on which muscle gets the credit).
- **iOS PWA storage eviction reality** — Tier 2 + cloud should handle this, but worth a real-world test (force-evict Safari storage, confirm app re-hydrates from cloud cleanly).
- **Error monitoring** — Sentry free tier (or equivalent) probably worth wiring before MVP goes live so mid-workout crashes are visible without manual repro. Decide at v1.3.
- **`// @ts-check` + JSDoc** on `storage/`, `migrate/`, and the future recommender. Free type safety, no build-step change. Decide at v1.1 when storage interface is being authored.
