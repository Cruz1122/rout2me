import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://rcdsqsvfxyfnrueoovpy.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZHNxc3ZmeHlmbnJ1ZW9vdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODk2MjEsImV4cCI6MjA3NTA2NTYyMX0.PRaW6F94PxYNaRGHx71U8vDBh4vA30Lol7n77L5hJN0';

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

// Cliente de Supabase para OAuth y otras funcionalidades
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
