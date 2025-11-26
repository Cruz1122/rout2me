import { useEffect, useRef } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import R2MLoader from '../shared/components/R2MLoader';

interface RouteGuardProps {
  readonly children: React.ReactNode;
}

/**
 * Componente que protege rutas verificando la autenticación
 * Redirige a /welcome si no hay sesión válida
 */
export default function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (isLoading) {
      hasRedirected.current = false;
      return;
    }

    // Si no está autenticado, redirigir a welcome (solo una vez)
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log('Usuario no autenticado, redirigiendo a /welcome');
      globalThis.location.href = '/welcome';
    }
  }, [isAuthenticated, isLoading]);

  // Mostrar loading mientras verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <R2MLoader />
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
