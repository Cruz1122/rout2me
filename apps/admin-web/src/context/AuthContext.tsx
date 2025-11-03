/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
}

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // Escuchar eventos de autenticación de Supabase (para OAuth)
  useEffect(() => {
    // Intentar obtener la sesión actual inmediatamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user = session.user;
        const newAccessToken = session.access_token;
        const newRefreshToken = session.refresh_token;

        const userObj = {
          id: user.id,
          email: user.email!,
          name:
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email,
          phone: user.user_metadata?.phone || '',
        };

        // Guardar en estado
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setUser(userObj);

        // Guardar en localStorage
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          const user = session.user;
          const newAccessToken = session.access_token;
          const newRefreshToken = session.refresh_token;

          const userObj = {
            id: user.id,
            email: user.email!,
            name:
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.email,
            phone: user.user_metadata?.phone || '',
          };

          // Guardar en estado
          setAccessToken(newAccessToken);
          setRefreshToken(newRefreshToken);
          setUser(userObj);

          // Guardar en localStorage
          localStorage.setItem('access_token', newAccessToken);
          localStorage.setItem('refresh_token', newRefreshToken);
          localStorage.setItem('user', JSON.stringify(userObj));
        } else if (event === 'SIGNED_OUT') {
          // Limpiar estado
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);

          // Limpiar localStorage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setAuth = (
    newAccessToken: string,
    newRefreshToken: string,
    newUser: User,
  ) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);

    // Guardar en localStorage
    localStorage.setItem('access_token', newAccessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const clearAuth = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    // Limpiar localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('persist:auth'); // Limpiar persist:auth de implementaciones anteriores

    // Limpiar cualquier otra clave relacionada con auth
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('persist:') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  };

  const isAuthenticated = !!accessToken && !!user;

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        user,
        setAuth,
        clearAuth,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
