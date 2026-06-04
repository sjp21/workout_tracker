import { signIn, signUp } from '../sync/auth.js';
import { isConfigured } from '../sync/supabase.js';

// Login overlay. If Supabase isn't configured (no env vars), we skip auth
// entirely and run the app local-only — same data, no cloud copy. Single-user
// email + password: "Sign in" for the returning case, "Create account" for the
// one-time first setup. "Continue without account" opts out of sync and runs
// local-only, remembered across sessions via localStorage.

const LOCAL_ONLY_KEY = 'stimulus.localOnly';

export function isLocalOnly() {
  try {
    return localStorage.getItem(LOCAL_ONLY_KEY) === '1';
  } catch {
    return false;
  }
}

function setLocalOnly() {
  try {
    localStorage.setItem(LOCAL_ONLY_KEY, '1');
  } catch {
    // localStorage unavailable (private mode); the card just won't persist
    // its dismissal, which is acceptable — the app still runs local-only.
  }
}

export function clearLocalOnly() {
  try {
    localStorage.removeItem(LOCAL_ONLY_KEY);
  } catch {
    // ignore; see setLocalOnly.
  }
}

export function renderAuthOverlay({ onSession, onLocalOnly }) {
  if (!isConfigured()) return null;

  const el = document.createElement('div');
  el.className = 'auth-card';
  el.innerHTML = `
    <h2>Sign in</h2>
    <div class="desc">Single user — your address is on the allowlist. First time? Create the account once, then sign in.</div>
    <input type="email" id="emailInput" placeholder="you@example.com" autocomplete="email" />
    <input type="password" id="passwordInput" placeholder="password" autocomplete="current-password" />
    <button class="add-btn" id="signInBtn">Sign In</button>
    <button class="add-btn secondary" id="signUpBtn">Create account</button>
    <button class="add-btn secondary" id="localOnlyBtn">Continue without account</button>
    <div class="auth-msg" id="authMsg"></div>
  `;

  const msg = el.querySelector('#authMsg');
  const creds = () => ({
    email: el.querySelector('#emailInput').value.trim(),
    password: el.querySelector('#passwordInput').value
  });

  el.querySelector('#signInBtn').addEventListener('click', async () => {
    const { email, password } = creds();
    try {
      msg.classList.remove('ok');
      msg.textContent = '';
      const session = await signIn(email, password);
      el.remove();
      onSession(session);
    } catch (e) {
      msg.textContent = e.message || 'Sign in failed.';
    }
  });

  el.querySelector('#localOnlyBtn').addEventListener('click', () => {
    setLocalOnly();
    el.remove();
    if (onLocalOnly) onLocalOnly();
  });

  el.querySelector('#signUpBtn').addEventListener('click', async () => {
    const { email, password } = creds();
    try {
      msg.classList.remove('ok');
      msg.textContent = '';
      const session = await signUp(email, password);
      if (session) {
        el.remove();
        onSession(session);
      } else {
        // Email confirmation is still enabled server-side; sign-up created the
        // user but no session yet. Disable confirmations to make this instant.
        msg.classList.add('ok');
        msg.textContent = 'Account created — confirm via the email link, then Sign In.';
      }
    } catch (e) {
      msg.textContent = e.message || 'Could not create account.';
    }
  });

  return el;
}
