/**
 * Configuración centralizada de navegación
 * Define relaciones padre-hijo entre rutas y categorías para navegación inteligente
 */

export type RouteCategory = 'auth' | 'main' | 'profile' | 'system';

export interface RouteConfig {
  path: string;
  category: RouteCategory;
  parent?: string;
  isMainRoute?: boolean; // Rutas principales donde normalmente no se puede navegar más atrás
  requiresAuth?: boolean;
}

/**
 * Mapa completo de todas las rutas con su configuración
 */
export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // Rutas del sistema
  '/location-permission': {
    path: '/location-permission',
    category: 'system',
    isMainRoute: true,
    requiresAuth: false,
  },
  '/welcome': {
    path: '/welcome',
    category: 'auth',
    isMainRoute: true,
    requiresAuth: false,
  },

  // Rutas de autenticación
  '/login': {
    path: '/login',
    category: 'auth',
    parent: '/welcome',
    requiresAuth: false,
  },
  '/register': {
    path: '/register',
    category: 'auth',
    parent: '/welcome',
    requiresAuth: false,
  },
  '/forgot-password': {
    path: '/forgot-password',
    category: 'auth',
    parent: '/login',
    requiresAuth: false,
  },
  '/reset-password': {
    path: '/reset-password',
    category: 'auth',
    parent: '/login',
    requiresAuth: false,
  },
  '/2fa': {
    path: '/2fa',
    category: 'auth',
    parent: '/login',
    requiresAuth: false,
  },
  '/expired-link': {
    path: '/expired-link',
    category: 'auth',
    parent: '/login',
    requiresAuth: false,
  },
  '/auth/confirm': {
    path: '/auth/confirm',
    category: 'auth',
    parent: '/login',
    requiresAuth: false,
  },

  // Rutas principales (tabs)
  '/inicio': {
    path: '/inicio',
    category: 'main',
    isMainRoute: true,
    requiresAuth: true,
  },
  '/rutas': {
    path: '/rutas',
    category: 'main',
    isMainRoute: true,
    requiresAuth: true,
  },
  '/buses': {
    path: '/buses',
    category: 'main',
    isMainRoute: true,
    requiresAuth: true,
  },
  '/perfil': {
    path: '/perfil',
    category: 'main',
    isMainRoute: true,
    requiresAuth: true,
  },

  // Rutas de perfil (hijas de /perfil)
  '/perfil/editar': {
    path: '/perfil/editar',
    category: 'profile',
    parent: '/perfil',
    requiresAuth: true,
  },
  '/perfil/cambiar-password': {
    path: '/perfil/cambiar-password',
    category: 'profile',
    parent: '/perfil',
    requiresAuth: true,
  },
  '/perfil/tema': {
    path: '/perfil/tema',
    category: 'profile',
    parent: '/perfil',
    requiresAuth: true,
  },
  '/perfil/cerrar-sesion': {
    path: '/perfil/cerrar-sesion',
    category: 'profile',
    parent: '/perfil',
    requiresAuth: true,
  },
  '/perfil/unirse-organizacion': {
    path: '/perfil/unirse-organizacion',
    category: 'profile',
    parent: '/perfil',
    requiresAuth: true,
  },
  '/perfil/abandonar-organizacion': {
    path: '/perfil/abandonar-organizacion',
    category: 'profile',
    parent: '/perfil',
    requiresAuth: true,
  },
};

/**
 * Obtiene la configuración de una ruta
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  // Normalizar la ruta (remover query params y hash)
  const normalizedPath = path.split('?')[0].split('#')[0];
  return ROUTE_CONFIG[normalizedPath];
}

/**
 * Verifica si una ruta es una ruta principal
 */
export function isMainRoute(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.isMainRoute ?? false;
}

/**
 * Verifica si una ruta requiere autenticación
 */
export function routeRequiresAuth(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.requiresAuth ?? false;
}

/**
 * Obtiene la ruta padre de una ruta dada
 */
export function getParentRoute(path: string): string | undefined {
  const config = getRouteConfig(path);
  return config?.parent;
}

/**
 * Obtiene todas las rutas principales
 */
export function getMainRoutes(): string[] {
  return Object.values(ROUTE_CONFIG)
    .filter((config) => config.isMainRoute)
    .map((config) => config.path);
}

/**
 * Obtiene todas las rutas de una categoría específica
 */
export function getRoutesByCategory(category: RouteCategory): string[] {
  return Object.values(ROUTE_CONFIG)
    .filter((config) => config.category === category)
    .map((config) => config.path);
}
