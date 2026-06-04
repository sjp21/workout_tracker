import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL || '';
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// Single-user allowlist. RLS enforces this server-side; this is just a
// client-side UX guard so the wrong email gets a clear message instead of an
// opaque RLS denial.
export const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL || 'sjp452@gmail.com';

export const supabase = URL && KEY ? createClient(URL, KEY) : null;

export function isConfigured() {
  return supabase !== null;
}
