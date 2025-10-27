import { useIonRouter } from '@ionic/react';
import { useAuth } from './useAuth';

/**
 * Utilidades para protección de rutas
 */

/**
 * Verifica si una ruta es pública (no requiere autenticación)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/welcome',
    '/login',
    '/register',
    '/email-verification',
    '/email-confirmation', // Alternativa común para verificación de email
    '/forgot-password', // Por si se implementa en el futuro
    '/reset-password', // Por si se implementa en el futuro
    '/2fa', // Verificación de dos factores
    '/location-permission', // Permisos de ubicación
  ];

  return publicRoutes.includes(pathname);
}

/**
 * Hook personalizado para manejar la protección de rutas
 */
export function useRouteProtection() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useIonRouter();

  const checkRouteAccess = (currentPath: string) => {
    // Si está cargando, no hacer nada
    if (isLoading) return;

    // Si es una ruta pública, permitir acceso
    if (isPublicRoute(currentPath)) {
      return;
    }

    // Si no está autenticado y no es ruta pública, redirigir
    if (!isAuthenticated) {
      console.log(`Acceso denegado a ${currentPath}, redirigiendo a /welcome`);
      router.push('/welcome', 'root');
    }
  };

  return {
    checkRouteAccess,
    isAuthenticated,
    isLoading,
    isPublicRoute,
  };
}
