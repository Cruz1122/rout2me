import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
const supabaseAnonKey = import.meta.env.VITE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_BACKEND_BASE_URL o VITE_ANON_KEY',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
