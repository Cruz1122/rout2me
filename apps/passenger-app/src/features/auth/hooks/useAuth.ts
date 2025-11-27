import { useState, useEffect, useCallback } from 'react';
import {
  authStorage,
  createAuthSession,
  logoutUser,
  getCurrentSession,
  convertSupabaseSessionToAuthSession,
} from '../services/authService';
import type { AuthSession, LoginResponse } from '../services/authService';

/**
 * Hook para manejo de autenticación con estado reactivo
 */
export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Helper para agregar timeout a promesas
   */
  const withTimeout = useCallback(
    <T>(
      promise: Promise<T>,
      timeoutMs: number,
      errorMessage: string,
    ): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
        ),
      ]);
    },
    [],
  );

  /**
   * Verifica y carga la sesión desde localStorage o Supabase (no bloqueante)
   */
  const checkSession = useCallback(async () => {
    try {
      // Primero verificar localStorage (rápido, no requiere red)
      const savedSession = authStorage.getSession();

      if (savedSession && authStorage.isSessionValid()) {
        setSession(savedSession);
        setIsAuthenticated(true);
        console.log(
          'Sesión válida encontrada en localStorage:',
          savedSession.user.user_metadata.name,
        );
        // Marcar como no cargando inmediatamente si tenemos sesión local
        setIsLoading(false);
        return;
      }

      // Si no hay sesión válida en localStorage, verificar Supabase con timeout
      console.log(
        'No hay sesión válida en localStorage, verificando Supabase...',
      );

      try {
        const supabaseSession = await withTimeout(
          getCurrentSession(),
          3000, // 3 segundos máximo para verificar sesión
          'Timeout verificando sesión en Supabase',
        );

        if (supabaseSession) {
          try {
            // Convertir la sesión de Supabase a nuestro formato
            const authSession =
              convertSupabaseSessionToAuthSession(supabaseSession);

            // Verificar si la sesión es válida antes de guardarla
            const now = Math.floor(Date.now() / 1000);
            if (authSession.expires_at > now) {
              // Guardar la sesión restaurada en localStorage
              authStorage.saveSession(authSession);
              setSession(authSession);
              setIsAuthenticated(true);
              console.log(
                'Sesión restaurada desde Supabase:',
                authSession.user.user_metadata.name,
              );
              return;
            } else {
              console.log('Sesión de Supabase expirada');
            }
          } catch (error) {
            console.error('Error convirtiendo sesión de Supabase:', error);
          }
        }
      } catch (error) {
        // Si falla la verificación de Supabase (timeout o error de red),
        // no es crítico - la app puede funcionar sin sesión
        console.warn('Error o timeout verificando sesión en Supabase:', error);
      }

      // No hay sesión válida en ningún lugar, limpiar todo
      authStorage.clearSession();
      setSession(null);
      setIsAuthenticated(false);
      console.log('No hay sesión válida');
    } catch (error) {
      console.error('Error verificando sesión:', error);
      authStorage.clearSession();
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      // Siempre marcar como no cargando, incluso si hay errores
      setIsLoading(false);
    }
  }, [withTimeout]);

  /**
   * Efecto para verificar la sesión al montar el componente
   * La verificación se hace de forma no bloqueante
   */
  useEffect(() => {
    // Iniciar verificación en background, no bloquear render
    checkSession().catch((error) => {
      console.error('Error crítico verificando sesión:', error);
      setIsLoading(false);
    });
  }, [checkSession]);

  /**
   * Inicia sesión y guarda los datos
   */
  const login = useCallback((loginResponse: LoginResponse) => {
    try {
      const authSession = createAuthSession(loginResponse);
      authStorage.saveSession(authSession);
      setSession(authSession);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }, []);

  /**
   * Cierra sesión y limpia los datos (incluye sesiones OAuth de Supabase)
   */
  const logout = useCallback(async () => {
    try {
      // Primero cerrar sesión en Supabase (OAuth o email/password)
      await logoutUser();

      // Luego limpiar localStorage
      authStorage.clearSession();
      setSession(null);
      setIsAuthenticated(false);
      console.log('Logout exitoso');
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así limpiar el storage local
      authStorage.clearSession();
      setSession(null);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * Refresca la sesión desde localStorage
   */
  const refreshSession = useCallback(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Obtiene el token de acceso actual
   */
  const getAccessToken = useCallback((): string | null => {
    return session?.access_token || null;
  }, [session]);

  /**
   * Obtiene los datos del usuario actual
   */
  const getUser = useCallback(() => {
    return session?.user || null;
  }, [session]);

  /**
   * Obtiene el refresh token
   */
  const getRefreshToken = useCallback((): string | null => {
    return session?.refresh_token || null;
  }, [session]);

  /**
   * Verifica si la sesión está próxima a expirar (menos de 5 minutos)
   */
  const isSessionExpiringSoon = useCallback((): boolean => {
    const timeRemaining = authStorage.getTimeRemaining();
    return timeRemaining > 0 && timeRemaining < 300; // 5 minutos
  }, []);

  /**
   * Obtiene el tiempo restante de la sesión en segundos
   */
  const getTimeRemaining = useCallback((): number => {
    return authStorage.getTimeRemaining();
  }, []);

  return {
    // Estado
    session,
    isAuthenticated,
    isLoading,

    // Datos del usuario
    user: getUser(),
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),

    // Acciones
    login,
    logout,
    refreshSession,

    // Utilidades
    isSessionExpiringSoon: isSessionExpiringSoon(),
    timeRemaining: getTimeRemaining(),
  };
}

/**
 * Hook simplificado para verificar solo si está autenticado
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook para obtener solo los datos del usuario
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}
