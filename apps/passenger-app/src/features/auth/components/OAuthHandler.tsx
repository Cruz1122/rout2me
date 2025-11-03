import { useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { supabase } from '../../../config/supabaseClient';
import {
  convertSupabaseSessionToAuthSession,
  authStorage,
} from '../services/authService';

/**
 * Componente que maneja el callback de OAuth (Google, Microsoft, etc.)
 * Detecta cuando el usuario regresa después de autenticarse con un proveedor OAuth
 */
export default function OAuthHandler() {
  const router = useIonRouter();

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // Convertir la sesión de Supabase a nuestro formato
          const authSession = convertSupabaseSessionToAuthSession(session);

          // Guardar la sesión
          authStorage.saveSession(authSession);

          // Redirigir a la página de inicio
          router.push('/inicio', 'forward', 'replace');
        } catch (error) {
          console.error('❌ Error guardando sesión OAuth:', error);
        }
      }

      if (event === 'SIGNED_OUT') {
        authStorage.clearSession();
      }
    });

    // Verificar si hay una sesión existente al cargar
    const checkExistingSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && !authStorage.isSessionValid()) {
        try {
          const authSession = convertSupabaseSessionToAuthSession(session);
          authStorage.saveSession(authSession);
        } catch (error) {
          console.error('❌ Error restaurando sesión:', error);
        }
      }
    };

    checkExistingSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null; // Este componente no renderiza nada
}
