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
    // Configurar para manejar deep links en móvil
    flowType: 'pkce', // Usar PKCE para mejor seguridad y compatibilidad con móvil
  },
  // Configuración de Realtime: el transporte se configura a nivel del canal
  // Las opciones globales se configuran en el canal mismo
});
