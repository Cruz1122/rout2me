import { useEffect, useRef } from 'react';
import { useIonRouter } from '@ionic/react';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { supabase } from '../../../config/supabaseClient';
import {
  convertSupabaseSessionToAuthSession,
  authStorage,
} from '../services/authService';
import { isNativePlatform } from '../../../shared/utils/platform';
import { NATIVE_OAUTH_CALLBACK } from '../../../shared/utils/oauthRedirect';

/**
 * Componente que maneja el callback de OAuth (Google, Microsoft, etc.)
 * Detecta cuando el usuario regresa después de autenticarse con un proveedor OAuth
 */
export default function OAuthHandler() {
  const router = useIonRouter();
  const isProcessingOAuth = useRef(false);

  useEffect(() => {
    // Función para manejar sesión OAuth
    const handleOAuthSession = async (session: {
      access_token: string;
      token_type: string;
      expires_in?: number;
      expires_at?: number;
      refresh_token: string;
      user: {
        id: string;
        aud?: string;
        role?: string;
        email?: string;
        user_metadata?: {
          company_key?: string;
          full_name?: string;
          name?: string;
          phone?: string;
          avatar_url?: string;
          picture?: string;
        };
      };
    }) => {
      if (isProcessingOAuth.current) {
        console.log('Ya se está procesando una sesión OAuth, ignorando...');
        return;
      }

      if (!session) {
        console.error(
          'handleOAuthSession: No se proporcionó una sesión válida',
        );
        return;
      }

      if (!session.access_token || !session.user) {
        console.error(
          'handleOAuthSession: Sesión inválida - faltan campos requeridos',
        );
        return;
      }

      try {
        isProcessingOAuth.current = true;
        console.log('Procesando sesión OAuth...');

        // Convertir la sesión de Supabase a nuestro formato
        let authSession;
        try {
          authSession = convertSupabaseSessionToAuthSession(session);
        } catch (conversionError) {
          console.error(
            'Error convirtiendo sesión de Supabase:',
            conversionError,
          );
          throw new Error('Error al convertir la sesión de autenticación');
        }

        // Guardar la sesión
        try {
          authStorage.saveSession(authSession);
          console.log('Sesión OAuth guardada correctamente');
        } catch (saveError) {
          console.error('Error guardando sesión en localStorage:', saveError);
          throw new Error('Error al guardar la sesión de autenticación');
        }

        // Redirigir a la página de inicio
        try {
          router.push('/inicio', 'forward', 'replace');
        } catch (routerError) {
          console.error('Error redirigiendo a /inicio:', routerError);
          // Intentar redirección alternativa
          window.location.href = '/inicio';
        }
      } catch (error) {
        console.error('Error guardando sesión OAuth:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido al procesar sesión OAuth';
        console.error('Detalles del error:', errorMessage);
        // No resetear isProcessingOAuth aquí para permitir reintentos
      } finally {
        // Resetear después de un pequeño delay para evitar procesamiento duplicado
        setTimeout(() => {
          isProcessingOAuth.current = false;
        }, 1000);
      }
    };

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log(
          'Evento de autenticación:',
          event,
          session ? 'con sesión' : 'sin sesión',
        );

        if (event === 'SIGNED_IN' && session) {
          console.log('Usuario autenticado, procesando sesión...');
          await handleOAuthSession(session);
        }

        if (event === 'SIGNED_OUT') {
          console.log('Usuario cerró sesión, limpiando almacenamiento...');
          try {
            authStorage.clearSession();
          } catch (error) {
            console.error('Error limpiando sesión:', error);
          }
        }

        // Manejar cuando se detecta una sesión en la URL (callback de OAuth)
        if (event === 'TOKEN_REFRESHED' && session) {
          // Actualizar sesión si se refresca el token
          try {
            console.log('Token refrescado, actualizando sesión...');
            const authSession = convertSupabaseSessionToAuthSession(session);
            authStorage.saveSession(authSession);
            console.log('Sesión actualizada correctamente');
          } catch (error) {
            console.error('Error actualizando sesión:', error);
          }
        }

        // Manejar errores de autenticación
        if (event === 'SIGNED_OUT' && !session) {
          // Esto puede ocurrir si hay un error durante el proceso OAuth
          console.warn(
            'Sesión cerrada sin sesión válida - posible error en OAuth',
          );
        }
      } catch (error) {
        console.error('Error en onAuthStateChange:', error);
      }
    });

    // En móvil, escuchar deep links cuando la app se abre desde OAuth
    let appUrlOpenListener: PluginListenerHandle | null = null;
    let appStateListener: PluginListenerHandle | null = null;

    const waitForSupabaseSession = async (source: string) => {
      if (isProcessingOAuth.current) {
        console.log(`Sesión OAuth ya en proceso, ignorando trigger ${source}`);
        return;
      }

      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        attempts += 1;
        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error(
              `Error obteniendo sesión desde ${source}:`,
              sessionError.message,
            );
            return;
          }

          if (session) {
            console.log(`Sesión encontrada (${source}, intento ${attempts})`);
            await handleOAuthSession(session);
            return;
          }
        } catch (error) {
          console.error(
            `Excepción obteniendo sesión (${source}, intento ${attempts}):`,
            error,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, attempts * 300));
      }

      console.warn(
        `No se encontró sesión después de ${maxAttempts} intentos (${source})`,
      );
    };

    const exchangeCode = async (code: string) => {
      if (!code) {
        return false;
      }

      if (isProcessingOAuth.current) {
        console.log('Código OAuth recibido pero ya se procesa una sesión.');
        return true;
      }

      try {
        console.log('Intercambiando código OAuth por sesión...');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (supabase.auth as any).exchangeCodeForSession({
          authCode: code,
        });

        if (result?.error) {
          console.error(
            'Error en exchangeCodeForSession:',
            result.error.message,
          );
          return false;
        }

        const session = result?.data?.session;
        if (session) {
          await handleOAuthSession(session);
          return true;
        }
      } catch (error) {
        console.error('Excepción en exchangeCodeForSession:', error);
      }

      return false;
    };

    const handleDeepLink = async (url: string, source: string) => {
      try {
        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get('code');
        const errorDescription =
          parsedUrl.searchParams.get('error_description');

        if (errorDescription) {
          console.error('OAuth error:', errorDescription);
        }

        if (code) {
          const exchanged = await exchangeCode(code);
          if (exchanged) {
            return;
          }
        }

        // Fallback: revisar hash tokens y polling
        if (parsedUrl.hash) {
          const hashParams = new URLSearchParams(
            parsedUrl.hash.replace(/^#/, ''),
          );
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken || refreshToken) {
            console.log(
              'Fragmento OAuth detectado, esperando sesión de Supabase...',
            );
            await waitForSupabaseSession(`${source}-hash`);
            return;
          }
        }

        await waitForSupabaseSession(source);
      } catch (error) {
        console.error('Error procesando deep link:', error);
        await waitForSupabaseSession(`${source}-fallback`);
      }
    };

    if (isNativePlatform()) {
      App.addListener('appStateChange', async (state) => {
        if (state.isActive && !isProcessingOAuth.current) {
          console.log('App volvió al foreground, verificando sesión OAuth...');
          await waitForSupabaseSession('appStateChange');
        }
      })
        .then((listener) => {
          appStateListener = listener;
        })
        .catch((error) =>
          console.error('Error registrando listener de appStateChange', error),
        );

      App.addListener('appUrlOpen', async (data) => {
        const url = data?.url ?? '';
        if (!url) {
          return;
        }

        const normalizedUrl = url.toLowerCase();
        if (!normalizedUrl.startsWith(NATIVE_OAUTH_CALLBACK)) {
          return;
        }

        console.log('🔗 Deep link OAuth recibido:', url);
        await handleDeepLink(url, 'appUrlOpen');
      })
        .then((listener) => {
          appUrlOpenListener = listener;
        })
        .catch((error) =>
          console.error('Error registrando listener de appUrlOpen', error),
        );
    }

    // Verificar si hay una sesión existente al cargar
    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Verificar si la sesión de localStorage es válida
          const savedSession = authStorage.getSession();
          const hasValidLocalSession =
            savedSession && authStorage.isSessionValid();

          // Si no hay sesión local válida, restaurar desde Supabase
          if (!hasValidLocalSession) {
            const authSession = convertSupabaseSessionToAuthSession(session);
            authStorage.saveSession(authSession);
            console.log('Sesión restaurada desde Supabase en OAuthHandler');
          }
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error);
      }
    };

    checkExistingSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
      appUrlOpenListener?.remove();
      appStateListener?.remove();
    };
  }, [router]);

  return null; // Este componente no renderiza nada
}
