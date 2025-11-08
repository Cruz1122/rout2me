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

// Nuevo tipo para el endpoint agregado
export interface ApiRouteVariantAggregated {
  route_id: string;
  route_code: string;
  route_name: string;
  route_active: boolean;
  variant_id: string;
  path: { lat: number; lng: number }[];
  length_m_json: number;
  stops: {
    stop_id: string;
    stop_name: string;
    location: { lat: number; lng: number };
  }[];
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

// Caché global para evitar llamadas duplicadas
let routesCache: Route[] | null = null;
let routesCachePromise: Promise<Route[]> | null = null;
let routesCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Función principal optimizada que obtiene todas las rutas con paradas usando caché
 * Esta es la única función que debe usarse en toda la aplicación
 */
export async function fetchAllRoutesData(): Promise<Route[]> {
  const now = Date.now();

  // Verificar si el caché es válido
  if (routesCache && now - routesCacheTimestamp < CACHE_DURATION) {
    return routesCache;
  }

  // Si ya hay una petición en curso, esperar a que termine
  if (routesCachePromise) {
    return routesCachePromise;
  }

  // Crear nueva petición
  routesCachePromise = fetchRoutesFromAPI();

  try {
    const result = await routesCachePromise;
    routesCache = result;
    routesCacheTimestamp = now;
    return result;
  } finally {
    routesCachePromise = null;
  }
}

/**
 * Función interna que hace la petición real a la API
 */
async function fetchRoutesFromAPI(): Promise<Route[]> {
  try {
    const response = await fetch(`${API_REST_URL}/v_route_variants_agg`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiVariants: ApiRouteVariantAggregated[] = await response.json();

    // Transformar los datos agregados a rutas
    return transformAggregatedVariantsToRoutes(apiVariants);
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
 * @deprecated Usar fetchAllRoutesData() en su lugar
 * Obtiene todas las route variants desde la API usando el endpoint optimizado
 */
export async function fetchRoutes(): Promise<Route[]> {
  return fetchAllRoutesData();
}

/**
 * @deprecated Usar fetchAllRoutesData() en su lugar
 * Obtiene todas las route variants con sus paradas desde la API usando el endpoint optimizado
 */
export async function fetchRoutesWithStops(): Promise<Route[]> {
  return fetchAllRoutesData();
}

/**
 * Limpia el caché de rutas (útil para forzar una nueva petición)
 */
export function clearRoutesCache(): void {
  routesCache = null;
  routesCachePromise = null;
  routesCacheTimestamp = 0;
}

/**
 * Obtiene información de una ruta específica usando datos en caché
 * Esta función NO hace peticiones a la API, usa los datos ya cargados
 */
export async function getRouteInfoFromCache(
  routeId: string,
): Promise<ApiRoute | null> {
  try {
    const routes = await fetchAllRoutesData();
    const route = routes.find((r) => r.id === routeId);

    if (!route) {
      return null;
    }

    return {
      idx: 0,
      id: route.id,
      code: route.code,
      name: route.name,
      active: route.active,
      created_at: route.created_at,
    };
  } catch (error) {
    console.error('Error getting route info from cache:', error);
    return null;
  }
}

/**
 * Obtiene las variantes de una ruta específica usando datos en caché
 * Esta función NO hace peticiones a la API, usa los datos ya cargados
 * Nota: Ahora cada variante es una ruta independiente, por lo que esta función
 * busca todas las rutas que comparten el mismo código de ruta
 */
export async function getRouteVariantsFromCache(
  routeId: string,
): Promise<RouteVariant[]> {
  try {
    const routes = await fetchAllRoutesData();

    // Buscar todas las rutas que comparten el mismo código de ruta
    const routesWithSameCode = routes.filter((r) => r.code === routeId);

    // Convertir a formato RouteVariant
    const variants: RouteVariant[] = routesWithSameCode.map((route) => ({
      id: route.id,
      route_id: routeId,
      path: route.path || [],
      length_m: 0, // No disponible en el formato actual
      stops: route.stops || [],
    }));

    return variants;
  } catch (error) {
    console.error('Error getting route variants from cache:', error);
    return [];
  }
}

/**
 * Obtiene información de una variante específica usando datos en caché
 * Esta función NO hace peticiones a la API, usa los datos ya cargados
 * Nota: Ahora cada variante es una ruta independiente, por lo que esta función
 * busca directamente por el ID de la variante
 */
export async function getVariantInfoFromCache(variantId: string): Promise<{
  route_id: string;
  route_code: string;
  route_name: string;
} | null> {
  try {
    const routes = await fetchAllRoutesData();

    // Buscar la ruta que tiene el ID de la variante
    const route = routes.find((r) => r.id === variantId);

    if (!route) {
      return null;
    }

    return {
      route_id: route.id, // Ahora el ID de la ruta es el mismo que el de la variante
      route_code: route.code,
      route_name: route.name,
    };
  } catch (error) {
    console.error('Error getting variant info from cache:', error);
    return null;
  }
}

/**
 * @deprecated Usar getRouteInfoFromCache() en su lugar
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
 * @deprecated Usar getRouteVariantsFromCache() en su lugar
 * Obtiene las variantes de una ruta específica usando el endpoint optimizado
 */
export async function fetchRouteVariants(
  routeId: string,
): Promise<RouteVariant[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/v_route_variants_agg?route_id=eq.${routeId}`,
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

    const apiVariants: ApiRouteVariantAggregated[] = await response.json();

    // Transformar las variantes agregadas
    return apiVariants.map((variant) => {
      const path: [number, number][] = variant.path.map((point) => [
        point.lng,
        point.lat,
      ]);

      const stops: Stop[] = variant.stops.map((stop) => ({
        id: stop.stop_id,
        name: stop.stop_name,
        created_at: '',
        location: [stop.location.lng, stop.location.lat],
      }));

      return {
        id: variant.variant_id,
        route_id: variant.route_id,
        path,
        length_m: variant.length_m_json,
        stops,
      };
    });
  } catch (error) {
    console.error('Error fetching route variants:', error);
    return [];
  }
}

/**
 * Transforma los datos agregados del nuevo endpoint a rutas
 * Cada variante se convierte en una ruta independiente
 */
function transformAggregatedVariantsToRoutes(
  apiVariants: ApiRouteVariantAggregated[],
): Route[] {
  const routes: Route[] = [];

  for (const variant of apiVariants) {
    // Convertir path a formato [lng, lat]
    const path: [number, number][] = variant.path.map((point) => [
      point.lng,
      point.lat,
    ]);

    // Convertir paradas al formato esperado
    const stops: Stop[] = variant.stops.map((stop) => ({
      id: stop.stop_id,
      name: stop.stop_name,
      created_at: '', // No viene en el endpoint agregado
      location: [stop.location.lng, stop.location.lat],
    }));

    // Crear una ruta independiente para cada variante
    const route: Route = {
      id: variant.variant_id, // Usar variant_id como ID único
      code: variant.route_code,
      name: variant.route_name,
      active: variant.route_active,
      created_at: '', // No viene en el endpoint agregado
      variants: [], // No necesitamos variantes aquí ya que cada ruta es una variante
      // Campos de compatibilidad
      number: variant.route_code,
      status: variant.route_active ? 'active' : 'offline',
      isFavorite: false,
      path: path,
      color: generateRouteColor(variant.route_code),
      stops: stops,
    };

    routes.push(route);
  }

  return routes;
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
