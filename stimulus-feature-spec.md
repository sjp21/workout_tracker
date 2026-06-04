# Stimulus — Feature Spec & Migration Notes

Handoff document for building out the Stimulus prototype (`hypertrophy-tracker.html`) into a more robust application.

## Context for Claude Code

The current app is a **single-file HTML prototype**: all markup, CSS, and JavaScript live in one `.html` file, with state persisted to `localStorage` under the key `hypertrophy-lab-v1`. It has two modes — **Train** (workout logging with auto-progression, rest timers, per-exercise history) and **Fuel** (macro tracking against Mifflin–St Jeor targets, a built-in ~87-item food database, and nutrition history).

State shape (current):

```
state = {
  mode, currentDayIdx,
  history: { [exerciseId]: [ { date, sets: [...] } ] },
  currentSession: { [exerciseId]: [ { weight, reps, rir, done } ] },
  profile: { weightLb, heightIn, age, sex, activity, goal },
  foodLog: { [dateKey]: [ { name, kcal, protein, carbs, fat, meal } ] }
}
```

Foods in the built-in DB are objects: `{ cat, name, kcal, p, c, f }` where amounts are per the serving described in `name`.

The four features below are listed in the user's priority order. **Feature 4 (durable data) should likely be tackled first**, because it changes the storage architecture that the other three build on.

---

## Feature 1 — "What should I eat next?" macro-gap recommender

### Goal
When the user has logged part of their day, suggest a food or simple meal that closes the gap between current intake and daily targets. Example: high protein / low carbs remaining → suggest a carb-forward option (rice, oats, fruit); high carbs / low protein remaining → suggest a protein-forward option (chicken, Greek yogurt, whey).

### Suggested approach
This is a small constrained-optimization / ranking problem, not an open-ended AI task. Keep it deterministic and explainable.

1. Compute `remaining = target − consumed` for each of calories, protein, carbs, fat.
2. Score each candidate food by how well its macro profile matches the *shape* of the remaining gap (e.g. cosine similarity between the food's macro vector and the remaining-macro vector), while not blowing past the calorie ceiling.
3. Surface the top 3–5, each with a one-line "why" ("+38g carbs, +6g protein — fills your biggest gap").
4. Optionally allow "meal" suggestions = small combinations (2–3 items) when no single food fits well.

### Notes / decisions to make
- Candidate pool = built-in DB + the user's previously logged custom foods + (optionally) live-search results from Feature 2.
- Protein gap should probably be weighted most heavily, since hitting the protein target matters more for hypertrophy than hitting carbs/fat exactly. Make the weighting a tunable constant.
- Respect the calorie ceiling as a hard-ish constraint (allow small overshoot, penalize large ones) rather than a strict cutoff.
- Keep the scoring logic in a pure, unit-testable function — no UI or storage coupling.
- Avoid prescriptive language if the user shows disordered-eating signals; this should *suggest*, never *restrict* or shame.

---

## Feature 2 — Live food/meal search (foods not in the built-in DB)

### Goal
A search box that queries an external nutrition database in real time so the user can log anything, not just the ~87 built-in items. Results should be addable to the log (and ideally cached as custom foods for reuse).

### Nutrition data source options (pick based on cost/coverage)
- **USDA FoodData Central** — free, official, generous rate limits, requires a free API key. Excellent for whole/raw foods; weaker on branded/restaurant items. Best default choice for accuracy.
- **Open Food Facts** — free, open, no key, strong on barcoded/branded products (good if barcode scanning is ever added). Crowdsourced, so data quality varies.
- **Nutritionix** — freemium, very strong on branded and restaurant items plus natural-language parsing ("2 eggs and a slice of toast"). Paid tiers for volume.

A reasonable architecture: query USDA first for whole foods, fall back to Open Food Facts for branded items; normalize both into the app's `{ name, kcal, p, c, f, serving }` shape behind a single `searchFoods(query)` interface so the UI doesn't care which backend answered.

### Notes / decisions to make
- **Don't call the API on every keystroke.** Debounce (~300ms) and require a minimum query length (3+ chars).
- Normalize wildly inconsistent serving sizes/units across sources into the app's serving model; let the user adjust quantity before logging.
- Cache results locally so repeat lookups are instant and offline-friendly; promote frequently-logged items into the user's personal food list.
- API keys must not be committed to the repo or shipped in client code — needs an env-var/secret strategy (and likely a thin proxy endpoint; see Feature 4's backend option).

---

## Feature 3 — Collapsible food list (replace the one giant table)

### Goal
The built-in food list is currently one long flat list. Make it browsable: collapsible sections by category (Protein, Dairy, Carbs, Fruit, Veg, Fats, Quick) that expand/collapse on tap, with the search/filter still working across all of them.

### Notes / decisions to make
- The data already carries a `cat` field on every food — group by that.
- Default state: all collapsed (or only the most-used category open) so the screen opens compact.
- When a search query is active, auto-expand sections that contain matches and show a result count per section.
- Persist which sections the user left open (small UI-state preference, separate from core data).
- Accessibility: real disclosure semantics (`<details>`/`<summary>` or `aria-expanded` buttons), full-width tap targets, smooth height animation.

---

## Feature 4 — Durable data across deploys (no more manual export/import)

### The actual problem
`localStorage` is keyed to an origin, so in principle data survives a redeploy to the *same* domain. In practice it gets wiped by: deploying to a different URL/preview domain, clearing site data, switching browsers/devices, or (for iOS PWAs) the OS evicting storage. The manual export/import added to the prototype is a backstop, but the user wants persistence to be automatic.

### Options, cheapest → most robust

**A. Harden local persistence (no backend).**
Move from `localStorage` to **IndexedDB** (larger quota, less eviction-prone) and add a **schema version + migration system** so app updates transform old data instead of discarding it. Add an explicit `schemaVersion` field; on load, run ordered migrations from the stored version up to current. This fixes "an update wiped my data" *as long as the deploy URL is stable*. Pair with periodic silent auto-export to a file the user can re-import as a safety net. Cost: $0. Doesn't solve cross-device.

**B. Lightweight cloud sync (recommended).**
Add a backend-as-a-service — **Supabase**, **Firebase**, or **Cloudflare D1/KV** — with simple auth (email magic-link or Google) and store the user's state server-side. On load, hydrate from the server; on change, write through to both local and server. Survives redeploys, new domains, and new devices, and gives a natural home for the Feature 2 API proxy (keeps the nutrition-API key server-side). Cost: $0 on free tiers for personal/low usage. Effort: roughly a day for blob-per-user; a weekend for proper tables.

**C. Full sync with offline + conflict resolution.**
Real-time multi-device sync with an offline write queue and merge logic (the Notion/Linear model). Only worth it for simultaneous multi-device editing. Likely overkill here.

### Recommendation
Do **A regardless** (IndexedDB + versioned migrations is the right foundation and makes "deploys don't wipe data" true on a stable domain). Add **B** if cross-device or true deploy-proof durability is wanted — and since Feature 2 needs a server-side place to hide an API key anyway, B pulls double duty.

### Decisions to make
- Decouple the data layer from the app entirely: a `storage` interface (`load`, `save`, `migrate`) with swappable backends (IndexedDB now, cloud later) so features 1–3 never touch storage internals directly.
- Define the migration framework up front, even before there are migrations to run.
- If choosing B: auth method, free-tier limits, and where the nutrition-API proxy lives.

---

## Suggested build order
1. **Feature 4A** — IndexedDB + schema/migration layer behind a `storage` interface. Foundation for everything else.
2. **Feature 3** — collapsible list. Self-contained UI work, low risk, immediate usability win.
3. **Feature 2** — live search (+ Feature 4B backend if a key proxy / cloud sync is wanted).
4. **Feature 1** — recommender, last, since its candidate pool is richest once live search and custom-food caching exist.

## Cross-cutting notes
- Moving from one HTML file to a real project (component structure, a build step, real state management) will make all four far easier to maintain — worth doing as part of this migration.
- Keep macro-scoring and target math as pure, tested functions independent of UI/storage.
- Preserve the existing evidence-based framing (Mifflin–St Jeor, Morton 2018 protein targets, Schoenfeld rest guidance) — it's a differentiator.
- Carry over the prototype's data so existing logs aren't lost: write a one-time importer from the current `localStorage['hypertrophy-lab-v1']` shape into whatever the new storage layer uses.
