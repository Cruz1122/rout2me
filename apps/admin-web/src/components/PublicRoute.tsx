import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalLoader from './GlobalLoader';

export default function PublicRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <GlobalLoader />;
  }

  if (isAuthenticated) {
    // Si ya está autenticado, redirigir a home
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
