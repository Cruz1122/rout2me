// Tipos para la API de buses
export interface ApiBus {
  id: string;
  company_id: string;
  plate: string;
  capacity: number;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  created_at: string;
  last_maintenance: string | null;
  passenger_count: number;
}

export interface BusLocation {
  latitude: number;
  longitude: number;
}

// Tipo para el bus transformado para la UI
export interface Bus {
  id: string;
  routeNumber: string;
  routeName: string;
  occupancy: 'low' | 'medium' | 'high';
  status: 'active' | 'nearby' | 'offline';
  licensePlate?: string;
  currentCapacity: number;
  maxCapacity: number;
  location: BusLocation;
}

const API_REST_URL = import.meta.env.VITE_BACKEND_REST_URL;

export interface BusServiceError {
  message: string;
  status?: number;
}

/**
 * Obtiene todos los buses desde la API
 */
export async function fetchBuses(): Promise<Bus[]> {
  try {
    const response = await fetch(`${API_REST_URL}/buses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apiKey: import.meta.env.VITE_PUBLISHABLE_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiBuses: ApiBus[] = await response.json();

    // Transformar los datos de la API al formato esperado por la UI
    return apiBuses.map(transformApiBusToBus);
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
function transformApiBusToBus(apiBus: ApiBus): Bus {
  // Mapear el estado de la API al estado de la UI
  const status = mapApiStatusToBusStatus(apiBus.status);

  // Calcular la ocupación basada en la capacidad actual vs máxima
  const occupancy = calculateOccupancy(apiBus.passenger_count, apiBus.capacity);

  // Generar ubicación mock (en una implementación real, esto vendría de la API)
  const location = generateMockLocation();

  // Generar información de ruta mock (en una implementación real, esto vendría de la API)
  const routeInfo = generateMockRouteInfo(apiBus.id);

  return {
    id: apiBus.id,
    routeNumber: routeInfo.routeNumber,
    routeName: routeInfo.routeName,
    occupancy,
    status,
    licensePlate: apiBus.plate,
    currentCapacity: apiBus.passenger_count,
    maxCapacity: apiBus.capacity,
    location,
  };
}

/**
 * Mapea el estado de la API al estado de la UI
 */
function mapApiStatusToBusStatus(apiStatus: ApiBus['status']): Bus['status'] {
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
 * Calcula el nivel de ocupación basado en la capacidad actual vs máxima
 */
function calculateOccupancy(current: number, max: number): Bus['occupancy'] {
  const percentage = (current / max) * 100;

  if (percentage < 33) return 'low';
  if (percentage < 66) return 'medium';
  return 'high';
}

/**
 * Genera una ubicación mock (en una implementación real, esto vendría de la API)
 */
function generateMockLocation(): BusLocation {
  // Puntos de referencia reales en Manizales para ubicaciones más variadas
  const manizalesPoints = [
    { lat: 5.0689, lng: -75.5174, name: 'Centro' }, // Centro de Manizales
    { lat: 5.0856, lng: -75.5238, name: 'Norte' }, // Zona Norte
    { lat: 5.0403, lng: -75.4938, name: 'Sur' }, // Zona Sur
    { lat: 5.0925, lng: -75.5338, name: 'Este' }, // Zona Este
    { lat: 5.0753, lng: -75.5188, name: 'Oeste' }, // Zona Oeste
    { lat: 5.1103, lng: -75.5638, name: 'Norte-Este' }, // Zona Norte-Este
    { lat: 5.0995, lng: -75.5438, name: 'Este-Sur' }, // Zona Este-Sur
    { lat: 5.0556, lng: -75.5088, name: 'Sur-Oeste' }, // Zona Sur-Oeste
  ];

  // Seleccionar un punto base aleatorio
  const basePoint =
    manizalesPoints[Math.floor(Math.random() * manizalesPoints.length)];

  // Agregar variación más pequeña para simular movimiento dentro de la zona
  const latVariation = (Math.random() - 0.5) * 0.005; // ±0.0025 grados (≈280m)
  const lngVariation = (Math.random() - 0.5) * 0.005; // ±0.0025 grados (≈280m)

  return {
    latitude: basePoint.lat + latVariation,
    longitude: basePoint.lng + lngVariation,
  };
}

/**
 * Genera información de ruta mock (en una implementación real, esto vendría de la API)
 */
function generateMockRouteInfo(busId: string): {
  routeNumber: string;
  routeName: string;
} {
  // Usar el ID del bus para generar información consistente
  const routeNumbers = ['501', '502', '503', '506', '204', '301'];
  const routeNames = [
    'Ruta Centro',
    'Ruta Norte',
    'Ruta Sur',
    'Ruta Maipú',
    'Ruta Ñuñoa',
    'Ruta Florida',
  ];

  // Usar el hash del ID para seleccionar de manera consistente
  const hash = busId.split('').reduce((a, b) => {
    a = (a << 5) - a + (b.codePointAt(0) ?? 0);
    return a & a;
  }, 0);

  const index = Math.abs(hash) % routeNumbers.length;

  return {
    routeNumber: routeNumbers[index],
    routeName: routeNames[index],
  };
}
