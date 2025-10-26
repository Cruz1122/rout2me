// Tipos para la API de buses con el nuevo endpoint
export interface ApiBusLatestPosition {
  bus_id: string;
  plate: string;
  company_id: string;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  active_trip_id: string | null;
  active_route_variant_id: string | null;
  vp_id: string | null;
  vp_at: string | null;
  location_json: { lat: number; lng: number } | null;
  speed_kph: number | null;
  heading: number | null;
}

export interface BusLocation {
  latitude: number;
  longitude: number;
}

// Tipo para información de ruta
export interface RouteInfo {
  id: string;
  code: string;
  name: string;
}

// Tipo para el bus transformado para la UI
export interface Bus {
  id: string;
  plate: string;
  routeNumber: string;
  routeName: string;
  occupancy: 'low' | 'medium' | 'high';
  status: 'active' | 'nearby' | 'offline';
  currentCapacity: number;
  maxCapacity: number;
  location: BusLocation | null;
  speed: number | null;
  heading: number | null;
  activeRouteVariantId: string | null;
}

const API_REST_URL = import.meta.env.VITE_BACKEND_REST_URL;

export interface BusServiceError {
  message: string;
  status?: number;
}

/**
 * Obtiene la información de ruta asociada a una variante
 */
async function fetchRouteInfoForVariant(
  variantId: string,
): Promise<RouteInfo | null> {
  try {
    const response = await fetch(
      `${API_REST_URL}/route_variants?id=eq.${variantId}&select=route_id`,
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
      return null;
    }

    const variants: { route_id: string }[] = await response.json();
    if (variants.length === 0) {
      return null;
    }

    // Obtener la información de la ruta
    const routeResponse = await fetch(
      `${API_REST_URL}/routes?id=eq.${variants[0].route_id}&select=id,code,name`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!routeResponse.ok) {
      return null;
    }

    const routes: { id: string; code: string; name: string }[] =
      await routeResponse.json();

    if (routes.length === 0) {
      return null;
    }

    return {
      id: routes[0].id,
      code: routes[0].code,
      name: routes[0].name,
    };
  } catch (error) {
    console.error('Error al obtener información de ruta:', error);
    return null;
  }
}

/**
 * Obtiene todos los buses desde la API usando el nuevo endpoint
 */
export async function fetchBuses(): Promise<Bus[]> {
  try {
    const response = await fetch(`${API_REST_URL}/v_bus_latest_positions`, {
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

    const apiBuses: ApiBusLatestPosition[] = await response.json();

    // Transformar los datos de la API al formato esperado por la UI
    const transformedBuses = await Promise.all(
      apiBuses.map(async (apiBus) => {
        return transformApiBusToBus(apiBus);
      }),
    );

    return transformedBuses;
  } catch (error) {
    console.error('Error fetching buses:', error);
    const serviceError: BusServiceError = {
      message:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener buses',
      status: error instanceof Response ? error.status : undefined,
    };
    throw serviceError;
  }
}

/**
 * Transforma un bus de la API al formato esperado por la UI
 */
async function transformApiBusToBus(
  apiBus: ApiBusLatestPosition,
): Promise<Bus> {
  // Mapear el estado de la API al estado de la UI
  const status = mapApiStatusToBusStatus(apiBus.status);

  // Obtener información de la ruta
  let routeInfo: RouteInfo | null = null;

  if (apiBus.active_route_variant_id) {
    // Primero intentar buscar en el mapa de rutas usando la variante
    routeInfo = await fetchRouteInfoForVariant(apiBus.active_route_variant_id);
  }

  // Si no se encontró la ruta, usar valores por defecto
  const routeNumber = routeInfo?.code || 'N/A';
  const routeName = routeInfo?.name || 'Sin ruta asignada';

  // Calcular ocupación (usar valores predeterminados ya que no están en la API)
  const occupancy = 'medium';
  const currentCapacity = 0; // No disponible en la API actual
  const maxCapacity = 40; // Capacidad estándar

  // Convertir location_json a BusLocation
  let location: BusLocation | null = null;
  if (apiBus.location_json) {
    location = {
      latitude: apiBus.location_json.lat,
      longitude: apiBus.location_json.lng,
    };
  }

  return {
    id: apiBus.bus_id,
    plate: apiBus.plate,
    routeNumber,
    routeName,
    occupancy,
    status,
    currentCapacity,
    maxCapacity,
    location,
    speed: apiBus.speed_kph,
    heading: apiBus.heading,
    activeRouteVariantId: apiBus.active_route_variant_id,
  };
}

/**
 * Mapea el estado de la API al estado de la UI
 */
function mapApiStatusToBusStatus(
  apiStatus: ApiBusLatestPosition['status'],
): Bus['status'] {
  switch (apiStatus) {
    case 'AVAILABLE':
      return 'active';
    case 'IN_SERVICE':
      return 'active';
    case 'OUT_OF_SERVICE':
      return 'offline';
    case 'MAINTENANCE':
      return 'offline';
    default:
      return 'offline';
  }
}

/**
 * Obtiene los buses que pertenecen a una variante de ruta específica
 */
export function getBusesByRouteVariant(
  buses: Bus[],
  routeVariantId: string,
): Bus[] {
  return buses.filter(
    (bus) =>
      bus.activeRouteVariantId === routeVariantId &&
      bus.status !== 'offline' &&
      bus.location !== null,
  );
}
