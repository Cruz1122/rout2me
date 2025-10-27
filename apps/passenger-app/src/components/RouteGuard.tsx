import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface RouteGuardProps {
  readonly children: React.ReactNode;
}

/**
 * Componente que protege rutas verificando la autenticación
 * Redirige a /welcome si no hay sesión válida
 */
export default function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (isLoading) return;

    // Si no está autenticado, redirigir a welcome
    if (!isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo a /welcome');
      globalThis.location.href = '/welcome';
    }
  }, [isAuthenticated, isLoading]);

  // Mostrar loading mientras verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-terciary)' }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (se redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, renderizar el contenido protegido
  return <>{children}</>;
}
