import { useState, useEffect, useCallback } from 'react';
import {
  authStorage,
  createAuthSession,
  logoutUser,
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
   * Verifica y carga la sesión desde localStorage
   */
  const checkSession = useCallback(() => {
    try {
      const savedSession = authStorage.getSession();

      if (savedSession && authStorage.isSessionValid()) {
        setSession(savedSession);
        setIsAuthenticated(true);
        console.log(
          'Sesión válida encontrada:',
          savedSession.user.user_metadata.name,
        );
      } else {
        // Limpiar sesión expirada o inválida
        authStorage.clearSession();
        setSession(null);
        setIsAuthenticated(false);
        console.log('No hay sesión válida');
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
      authStorage.clearSession();
      setSession(null);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * Efecto para verificar la sesión al montar el componente
   */
  useEffect(() => {
    checkSession();
    setIsLoading(false);
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
