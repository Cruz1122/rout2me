import { useMemo } from 'react';
import {
  getRouteConfig,
  getParentRoute,
  isMainRoute,
  routeRequiresAuth,
  type RouteCategory,
} from '../../../config/navigationConfig';

/**
 * Hook para navegación inteligente que determina rutas válidas de retroceso
 * basándose en relaciones padre-hijo y estado de autenticación
 */
export function useSmartNavigation(isAuthenticated: boolean) {
  /**
   * Determina si se puede navegar hacia atrás a una ruta específica
   * Considera:
   * - Estado de autenticación
   * - Si la ruta requiere autenticación
   * - Si es una ruta de autenticación y el usuario ya está autenticado
   */
  const canNavigateBack = useMemo(
    () =>
      (targetRoute: string): boolean => {
        const config = getRouteConfig(targetRoute);

        // Si no hay configuración, permitir (por seguridad, mejor errar del lado permisivo)
        if (!config) {
          return true;
        }

        // Si el usuario está autenticado, no puede retroceder a rutas de autenticación
        // (excepto en casos especiales como logout)
        if (isAuthenticated && config.category === 'auth') {
          // Permitir retroceso a /welcome solo si está en proceso de logout
          // En otros casos, no permitir retroceso a rutas de auth cuando estás autenticado
          return false;
        }

        // Si el usuario no está autenticado, no puede retroceder a rutas que requieren auth
        if (!isAuthenticated && routeRequiresAuth(targetRoute)) {
          return false;
        }

        return true;
      },
    [isAuthenticated],
  );

  /**
   * Determina la ruta válida a la que se debe retroceder desde la ruta actual
   * Prioriza rutas padre sobre historial del navegador
   *
   * @param currentPath - Ruta actual
   * @param historyEntries - Entradas del historial (opcional, para validación adicional)
   * @returns Ruta válida de retroceso o null si no hay ruta válida
   */
  const getValidBackRoute = useMemo(
    () =>
      (currentPath: string, historyEntries?: string[]): string | null => {
        const normalizedCurrentPath = currentPath.split('?')[0].split('#')[0];
        const config = getRouteConfig(normalizedCurrentPath);

        // Si estamos en una ruta principal, no hay retroceso válido
        // (el usuario debe usar el mensaje "Presiona otra vez para salir")
        if (isMainRoute(normalizedCurrentPath)) {
          return null;
        }

        // Prioridad 1: Usar la ruta padre definida en la configuración
        const parentRoute = getParentRoute(normalizedCurrentPath);
        if (parentRoute && canNavigateBack(parentRoute)) {
          return parentRoute;
        }

        // Prioridad 2: Si hay historial disponible, buscar la primera ruta válida
        if (historyEntries && historyEntries.length > 0) {
          // Buscar en el historial de más reciente a más antiguo
          for (const historyPath of historyEntries.reverse()) {
            const normalizedHistoryPath = historyPath
              .split('?')[0]
              .split('#')[0];
            if (
              normalizedHistoryPath !== normalizedCurrentPath &&
              canNavigateBack(normalizedHistoryPath)
            ) {
              return normalizedHistoryPath;
            }
          }
        }

        // Prioridad 3: Si estamos en una ruta de perfil sin padre, ir a /perfil
        if (config?.category === 'profile' && !parentRoute) {
          if (canNavigateBack('/perfil')) {
            return '/perfil';
          }
        }

        // Prioridad 4: Si estamos en una ruta de auth sin padre, ir a /welcome
        if (config?.category === 'auth' && !parentRoute) {
          if (canNavigateBack('/welcome')) {
            return '/welcome';
          }
        }

        // Si no hay ruta válida, retornar null
        // Esto activará el mensaje "Presiona otra vez para salir"
        return null;
      },
    [canNavigateBack],
  );

  /**
   * Obtiene la ruta por defecto para un usuario autenticado
   */
  const getDefaultAuthenticatedRoute = useMemo(
    () => (): string => {
      return '/inicio';
    },
    [],
  );

  /**
   * Obtiene la ruta por defecto para un usuario no autenticado
   */
  const getDefaultUnauthenticatedRoute = useMemo(
    () => (): string => {
      return '/welcome';
    },
    [],
  );

  /**
   * Verifica si una ruta pertenece a una categoría específica
   */
  const isRouteInCategory = useMemo(
    () =>
      (path: string, category: RouteCategory): boolean => {
        const config = getRouteConfig(path);
        return config?.category === category;
      },
    [],
  );

  return {
    getValidBackRoute,
    canNavigateBack,
    getDefaultAuthenticatedRoute,
    getDefaultUnauthenticatedRoute,
    isRouteInCategory,
  };
}
