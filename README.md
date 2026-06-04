# Stimulus

Evidence-based dumbbell hypertrophy + nutrition tracker. iPhone-only PWA, single user.

See [`BUILD_PLAN.md`](./BUILD_PLAN.md) for the locked design contract.

## Dev

```bash
npm install
npm run dev       # vite dev server
npm test          # vitest
npm run lint      # eslint
npm run build     # production build → dist/
npm run icons     # regenerate placeholder PWA icons
```

## Environment

Copy `.env.example` → `.env.local` and fill in Supabase keys for cloud sync.
If unset, the app runs local-only (IndexedDB) with no Supabase calls.

## Layout

```
src/
  data/        program, foods, evidence — static reference data
  lib/         pure logic: nutrition math, progression, volume, no DOM
  storage/     IndexedDB + migration registry + legacy localStorage importer
  sync/        Supabase client, email-OTP auth, dirty-flag flusher
  ui/          DOM renderers: today, train, fuel, modals, rest timer
  pwa/         service-worker registration + reload toast
  main.js      boot: load → render → wire → flush
  styles.css   all CSS
supabase/schema.sql  one-time DDL for user_state + RLS
```
