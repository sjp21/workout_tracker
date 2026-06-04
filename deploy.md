# Deploy Stimulus to GitHub Pages (with durable cloud sync)

This deploys the app to GitHub Pages and turns on Supabase cloud sync so your
training history survives storage eviction, a new phone, or a reinstall.

The PWA build is already configured correctly for Pages (`vite.config.js` uses
`base: './'`, so assets/service-worker/manifest resolve under the `/<repo>/`
subpath). You only need to (1) stand up Supabase and (2) flip on Pages.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **New project** (free tier is fine).
2. Once it's provisioned, open **SQL Editor** → paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the
   `user_state` table and its row-level-security policies.
3. Enable email auth: **Authentication → Providers → Email**, turn ON
   **"Enable Email provider"**, and turn OFF **"Confirm email"** is *not*
   needed — the app uses one-time codes (OTP), which work out of the box.
4. Grab your keys from **Project Settings → API**:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon / public** key → this is `VITE_SUPABASE_ANON_KEY`

> The anon key is meant to be public — it ships inside the client bundle and is
> protected by row-level security + the single-email allowlist. **Never** put
> the `service_role` key in these secrets or the repo.

---

## 2. Add the secrets to GitHub

In the repo: **Settings → Secrets and variables → Actions → New repository
secret**. Add both:

| Name                     | Value                          |
| ------------------------ | ------------------------------ |
| `VITE_SUPABASE_URL`      | the Project URL from step 1.4  |
| `VITE_SUPABASE_ANON_KEY` | the anon/public key            |

The deploy workflow (`.github/workflows/ci.yml`) injects these at build time.

---

## 3. Enable GitHub Pages

1. **Settings → Pages → Build and deployment → Source = "GitHub Actions".**
   (Not "Deploy from a branch" — the workflow uploads a Pages artifact.)
2. Push to `main` (or re-run the latest **Actions → CI** workflow). The
   `deploy` job builds with the secrets and publishes `dist/`.
3. Your URL will be `https://<username>.github.io/<repo>/`.

---

## 4. Verify the allowlist email

Cloud sync only accepts your email. Confirm `ALLOWED_EMAIL` in
`src/sync/auth.js` (and any `VITE_ALLOWED_EMAIL` override) is set to the address
you'll log in with — currently `sjp452@gmail.com`.

---

## 5. Install on your phone & log in

1. Open the Pages URL in **Safari (iOS)** or **Chrome (Android)**.
2. **iOS:** Share → **Add to Home Screen**. **Android:** menu → **Install app**
   / **Add to Home screen**.
3. Launch it from the home-screen icon (this gives it a persistent, standalone
   storage container).
4. Log in: enter your email, then the 6-digit OTP code Supabase emails you.

After login, the app pulls any cloud state on launch and pushes local changes in
the background. Your data now lives in Postgres; local IndexedDB is just a cache.

---

## Notes / limitations

- **Single device by design.** Sync is last-write-wins on the whole-state blob.
  One home-screen install is safe. If you *also* edit in a separate browser tab
  or a second device, the last save wins and can clobber the other.
- **Skipping Supabase = local-only.** The app still works without the secrets,
  but your only copy is IndexedDB, which iOS can evict under storage pressure or
  lose with the phone. Home-screen install exempts you from Safari's 7-day
  storage cap, but not from eviction or device loss.
- **Session loss ≠ data loss.** If storage is evicted you'll be logged out and
  re-enter the OTP; cloud data is intact, but edits made while logged out won't
  have pushed.
