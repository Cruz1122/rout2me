// Tipos para la API de rutas
export interface ApiRoute {
  idx: number;
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface ApiRouteVariant {
  idx: number;
  id: string;
  route_id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  path: { lat: number; lng: number }[]; // Array de objetos {lat, lng}
  length_m_json: number;
}

// Tipo para la ruta transformada para la UI
export interface Route {
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
  variants: RouteVariant[];
  // Campos adicionales para compatibilidad con la UI existente
  number: string; // alias para code
  origin?: string;
  destination?: string;
  via?: string;
  duration?: number;
  fare?: number;
  activeBuses?: number;
  status: 'active' | 'offline';
  isFavorite?: boolean;
  nextBus?: number;
  path?: [number, number][]; // Array de [lng, lat] para dibujar en el mapa
  color?: string; // Color de la línea en el mapa
}

export interface RouteVariant {
  id: string;
  route_id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  path: [number, number][]; // Array de [lng, lat]
  length_m: number;
}

const API_REST_URL = import.meta.env.VITE_BACKEND_REST_URL;

export interface RouteServiceError {
  message: string;
  status?: number;
}

/**
 * Obtiene todas las route variants desde la API
 */
export async function fetchRoutes(): Promise<Route[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/route_variants?select=id,route_id,direction,path,length_m_json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiVariants: ApiRouteVariant[] = await response.json();

    // Obtener información de rutas para cada variante
    const routesWithVariants = await Promise.all(
      apiVariants.map(async (variant) => {
        const routeInfo = await fetchRouteInfo(variant.route_id);
        return transformApiRouteVariantToRoute(variant, routeInfo);
      }),
    );

    return routesWithVariants;
  } catch (error) {
    console.error('Error fetching routes:', error);
    const serviceError: RouteServiceError = {
      message:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener rutas',
      status: error instanceof Response ? error.status : undefined,
    };
    throw serviceError;
  }
}

/**
 * Obtiene información de una ruta específica
 */
export async function fetchRouteInfo(routeId: string): Promise<ApiRoute> {
  try {
    const response = await fetch(
      `${API_REST_URL}/routes?select=id,code,name,active,created_at&id=eq.${routeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const routes: ApiRoute[] = await response.json();
    return routes[0];
  } catch (error) {
    console.error('Error fetching route info:', error);
    throw error;
  }
}

/**
 * Obtiene las variantes de una ruta específica
 */
export async function fetchRouteVariants(
  routeId: string,
): Promise<RouteVariant[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/route_variants?select=id,route_id,direction,path,length_m_json&route_id=eq.${routeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiVariants: ApiRouteVariant[] = await response.json();

    // Transformar las variantes
    return apiVariants.map(transformApiRouteVariantToRouteVariant);
  } catch (error) {
    console.error('Error fetching route variants:', error);
    return [];
  }
}

/**
 * Transforma una route variant de la API al formato esperado por la UI
 */
function transformApiRouteVariantToRoute(
  variant: ApiRouteVariant,
  routeInfo: ApiRoute,
): Route {
  // El path ya viene como array parseado, convertir a [lng, lat]
  const path: [number, number][] = Array.isArray(variant.path)
    ? variant.path.map((point: { lat: number; lng: number }) => [
        point.lng,
        point.lat,
      ])
    : [];

  return {
    id: variant.id,
    code: routeInfo.code,
    name: routeInfo.name,
    active: routeInfo.active,
    created_at: routeInfo.created_at,
    variants: [], // No necesitamos variantes aquí
    // Campos de compatibilidad - solo datos reales
    number: routeInfo.code,
    status: routeInfo.active ? 'active' : 'offline',
    isFavorite: false,
    // La ruta YA tiene las coordenadas del path
    path: path,
    color: generateRouteColor(routeInfo.code),
  };
}

/**
 * Transforma una variante de ruta de la API al formato esperado por la UI
 */
function transformApiRouteVariantToRouteVariant(
  apiVariant: ApiRouteVariant,
): RouteVariant {
  // El path ya viene como array parseado, convertir a [lng, lat]
  const path: [number, number][] = Array.isArray(apiVariant.path)
    ? apiVariant.path.map((point: { lat: number; lng: number }) => [
        point.lng,
        point.lat,
      ])
    : [];

  return {
    id: apiVariant.id,
    route_id: apiVariant.route_id,
    direction: apiVariant.direction,
    path,
    length_m: apiVariant.length_m_json,
  };
}

/**
 * Genera un color para la ruta basado en su código
 */
function generateRouteColor(code: string): string {
  const colors = [
    'var(--color-secondary)', // #1E56A0
    '#FF6B35',
    '#4CAF50',
    '#9C27B0',
    '#FF9800',
    '#607D8B',
    '#E91E63',
    '#00BCD4',
    '#8BC34A',
    '#FF5722',
  ];

  // Usar el hash del código para seleccionar un color consistente
  const hash = code.split('').reduce((a, b) => {
    a = (a << 5) - a + (b.codePointAt(0) ?? 0);
    return a & a;
  }, 0);

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Obtiene las rutas favoritas (filtradas por isFavorite: true)
 */
export function getFavoriteRoutes(routes: Route[]): Route[] {
  return routes.filter((route) => route.isFavorite);
}

/**
 * Obtiene las rutas recientes (últimas 3 rutas)
 */
export function getRecentRoutes(routes: Route[]): Route[] {
  return routes.slice(0, 3);
}
