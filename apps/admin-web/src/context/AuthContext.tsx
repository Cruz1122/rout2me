import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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
