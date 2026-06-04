import { signIn, signUp } from '../sync/auth.js';
import { isConfigured } from '../sync/supabase.js';

// Login overlay. If Supabase isn't configured (no env vars), we skip auth
// entirely and run the app local-only — same data, no cloud copy. Single-user
// email + password: "Sign in" for the returning case, "Create account" for the
// one-time first setup.

export function renderAuthOverlay({ onSession }) {
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
