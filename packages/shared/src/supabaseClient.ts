import { createClient } from '@supabase/supabase-js';

export function createSupabase() {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ??
    (globalThis as any).process?.env?.VITE_SUPABASE_URL;
  const anon =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
    (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon)
    throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  return createClient(url, anon);
}
