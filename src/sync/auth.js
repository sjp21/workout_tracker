import { supabase, isConfigured, ALLOWED_EMAIL } from './supabase.js';

// Email OTP — 6-digit code via email, NOT magic link. Magic link breaks on iOS
// standalone PWAs because tapping the link in Mail opens Safari (not the
// installed PWA), splitting the session into the wrong context. OTP keeps the
// session in whichever browser context the user is currently in.

export async function sendOtp(email) {
  if (!isConfigured()) throw new Error('Supabase not configured');
  if (email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    throw new Error('This app is single-user. That email is not on the allowlist.');
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  });
  if (error) throw error;
}

export async function verifyOtp(email, token) {
  if (!isConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });
  if (error) throw error;
  return data.session;
}

export async function getSession() {
  if (!isConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signOut() {
  if (!isConfigured()) return;
  await supabase.auth.signOut();
}

export function onAuthChange(cb) {
  if (!isConfigured()) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
