import { sendOtp, verifyOtp } from '../sync/auth.js';
import { isConfigured } from '../sync/supabase.js';

// Optional login overlay. If Supabase isn't configured (no env vars), we skip
// auth entirely and run the app local-only — same data, no cloud copy.
// Stays out of the user's way; only renders when explicitly opened.

export function renderAuthOverlay({ onSession }) {
  if (!isConfigured()) return null;

  const el = document.createElement('div');
  el.className = 'auth-card';
  el.innerHTML = `
    <h2>Sign in</h2>
    <div class="desc">Email a one-time code. Single user — your address is on the allowlist.</div>
    <input type="email" id="emailInput" placeholder="you@example.com" autocomplete="email" />
    <button class="add-btn" id="sendOtpBtn">Send Code</button>
    <div id="otpForm" style="display:none; margin-top:14px;">
      <input type="text" id="otpInput" placeholder="6-digit code" inputmode="numeric" maxlength="6" />
      <button class="add-btn" id="verifyOtpBtn">Verify</button>
    </div>
    <div class="auth-msg" id="authMsg"></div>
  `;

  const msg = el.querySelector('#authMsg');
  el.querySelector('#sendOtpBtn').addEventListener('click', async () => {
    const email = el.querySelector('#emailInput').value.trim();
    try {
      msg.textContent = '';
      await sendOtp(email);
      msg.classList.add('ok');
      msg.textContent = 'Code sent — check your inbox.';
      el.querySelector('#otpForm').style.display = 'block';
    } catch (e) {
      msg.classList.remove('ok');
      msg.textContent = e.message || 'Failed to send code.';
    }
  });

  el.querySelector('#verifyOtpBtn').addEventListener('click', async () => {
    const email = el.querySelector('#emailInput').value.trim();
    const token = el.querySelector('#otpInput').value.trim();
    try {
      const session = await verifyOtp(email, token);
      el.remove();
      onSession(session);
    } catch (e) {
      msg.classList.remove('ok');
      msg.textContent = e.message || 'Invalid code.';
    }
  });

  return el;
}
