import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalLoader from './GlobalLoader';

export default function ProtectedRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <GlobalLoader />;
  }

  if (!isAuthenticated) {
    // Redirigir a signin si no está autenticado
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
