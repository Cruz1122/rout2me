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
  direction?: 'INBOUND' | 'OUTBOUND'; // Campo opcional ya que no existe en la BD
  path: { lat: number; lng: number }[]; // Array de objetos {lat, lng}
  length_m_json: number;
}

// Tipos para paradas
export interface ApiStop {
  id: string;
  name: string;
  created_at: string;
  location_json: { lat: number; lng: number };
}

export interface Stop {
  id: string;
  name: string;
  created_at: string;
  location: [number, number]; // [lng, lat] para MapLibre
}

export interface ApiRouteVariantStop {
  variant_id: string;
  stop_id: string;
}

export interface RouteVariantStop {
  variant_id: string;
  stop_id: string;
  stop: Stop;
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
  stops?: Stop[]; // Paradas asociadas a esta ruta
}

export interface RouteVariant {
  id: string;
  route_id: string;
  direction?: 'INBOUND' | 'OUTBOUND'; // Campo opcional ya que no existe en la BD
  path: [number, number][]; // Array de [lng, lat]
  length_m: number;
  stops?: Stop[]; // Paradas asociadas a esta variante
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
      `${API_REST_URL}/route_variants?select=id,route_id,path,length_m_json`,
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
 * Obtiene todas las route variants con sus paradas desde la API
 */
export async function fetchRoutesWithStops(): Promise<Route[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/route_variants?select=id,route_id,path,length_m_json`,
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

    // Obtener información de rutas y paradas para cada variante
    const routesWithVariants = await Promise.all(
      apiVariants.map(async (variant) => {
        const [routeInfo, stops] = await Promise.all([
          fetchRouteInfo(variant.route_id),
          fetchStopsForVariant(variant.id),
        ]);

        const route = transformApiRouteVariantToRoute(variant, routeInfo);

        // Agregar paradas a la ruta
        if (stops.length > 0) {
          route.stops = stops;
        }

        return route;
      }),
    );

    return routesWithVariants;
  } catch (error) {
    console.error('Error fetching routes with stops:', error);
    const serviceError: RouteServiceError = {
      message:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener rutas con paradas',
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
    direction: apiVariant.direction, // Puede ser undefined
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

/**
 * Obtiene todas las paradas desde la API
 */
export async function fetchStops(): Promise<Stop[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/stops?select=id,name,created_at,location_json`,
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

    const apiStops: ApiStop[] = await response.json();
    return apiStops.map(transformApiStopToStop);
  } catch (error) {
    console.error('Error fetching stops:', error);
    throw error;
  }
}

/**
 * Obtiene las relaciones route_variant_stops desde la API
 */
export async function fetchRouteVariantStops(): Promise<RouteVariantStop[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/route_variant_stops?select=variant_id,stop_id`,
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

    const apiRelations: ApiRouteVariantStop[] = await response.json();

    // Obtener todas las paradas para hacer el join
    const stops = await fetchStops();

    // Crear un mapa de paradas por ID para acceso rápido
    const stopsMap = new Map(stops.map((stop) => [stop.id, stop]));

    // Transformar las relaciones incluyendo la información de la parada
    return apiRelations
      .map((relation) => ({
        variant_id: relation.variant_id,
        stop_id: relation.stop_id,
        stop: stopsMap.get(relation.stop_id)!,
      }))
      .filter((relation) => relation.stop); // Filtrar relaciones sin parada válida
  } catch (error) {
    console.error('Error fetching route variant stops:', error);
    throw error;
  }
}

/**
 * Obtiene las paradas para una variante específica
 */
export async function fetchStopsForVariant(variantId: string): Promise<Stop[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/route_variant_stops?select=stop_id&variant_id=eq.${variantId}`,
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

    const relations: ApiRouteVariantStop[] = await response.json();

    if (relations.length === 0) {
      return [];
    }

    // Obtener las paradas específicas
    const stopIds = relations.map((rel) => rel.stop_id).join(',');
    const stopsResponse = await fetch(
      `${API_REST_URL}/stops?select=id,name,created_at,location_json&id=in.(${stopIds})`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!stopsResponse.ok) {
      throw new Error(
        `Error ${stopsResponse.status}: ${stopsResponse.statusText}`,
      );
    }

    const apiStops: ApiStop[] = await stopsResponse.json();
    return apiStops.map(transformApiStopToStop);
  } catch (error) {
    console.error('Error fetching stops for variant:', error);
    return [];
  }
}

/**
 * Transforma una parada de la API al formato esperado por la UI
 */
function transformApiStopToStop(apiStop: ApiStop): Stop {
  return {
    id: apiStop.id,
    name: apiStop.name,
    created_at: apiStop.created_at,
    location: [apiStop.location_json.lng, apiStop.location_json.lat], // Convertir a [lng, lat]
  };
}
