import { supabase, isConfigured, ALLOWED_EMAIL } from './supabase.js';

// Email + password auth. Single-user: only the allowlisted address may sign in.
// Chosen over email OTP / magic link because both need email delivery the
// built-in Supabase sender can't customize without SMTP, and links break on
// iOS standalone PWAs (tapping in Mail opens Safari, splitting the session).
// Password needs no email at all once the account exists — provided email
// confirmation is disabled in the Supabase Auth settings so sign-up is instant.

function assertAllowed(email) {
  if (email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    throw new Error('This app is single-user. That email is not on the allowlist.');
  }
}

export async function signIn(email, password) {
  if (!isConfigured()) throw new Error('Supabase not configured');
  assertAllowed(email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUp(email, password) {
  if (!isConfigured()) throw new Error('Supabase not configured');
  assertAllowed(email);
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // With email confirmation disabled, a session comes back immediately.
  // If it's still enabled, session is null until the user confirms by email.
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
