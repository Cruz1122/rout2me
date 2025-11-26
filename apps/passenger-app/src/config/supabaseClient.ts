import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.backend.baseUrl;
const supabaseAnonKey = config.supabase.anonKey;

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
