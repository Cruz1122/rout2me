// Servicio para operaciones del conductor

export interface DriverBus {
  bus_id: string;
  plate: string;
  company_id: string;
  company_name: string;
  company_short_name?: string;
  is_active: boolean;
  passenger_count: number;
  capacity: number;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  type?: 'bus' | 'buseta' | 'microbus';
  has_ramp?: boolean;
  assignment_created_at?: string;
  assignment_updated_at?: string;
}

export interface DriverServiceError {
  message: string;
  status?: number;
}

const REST_URL = import.meta.env.VITE_BACKEND_REST_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const PUBLISHABLE_KEY =
  import.meta.env.VITE_PUBLISHABLE_KEY || import.meta.env.VITE_SERVICE_ROLE_KEY;

/**
 * Obtiene la lista de buses asignados al conductor
 */
export async function getDriverBuses(
  accessToken: string,
): Promise<DriverBus[]> {
  if (!REST_URL) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_BACKEND_REST_URL',
    );
  }

  if (!ANON_KEY) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_ANON_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  try {
    const response = await fetch(`${REST_URL}/rpc/driver_my_buses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: DriverServiceError = {
        message:
          errorData.message ||
          `Error al obtener buses del conductor: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }

    const buses: DriverBus[] = await response.json();
    return buses;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al obtener buses del conductor',
    );
  }
}

/**
 * Activa o desactiva un bus del conductor
 */
export async function setBusActive(
  accessToken: string,
  busId: string,
  active: boolean,
): Promise<void> {
  if (!REST_URL) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_BACKEND_REST_URL',
    );
  }

  if (!PUBLISHABLE_KEY) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_PUBLISHABLE_KEY o VITE_SERVICE_ROLE_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  if (!busId) {
    throw new Error('ID del bus no proporcionado');
  }

  try {
    const response = await fetch(`${REST_URL}/rpc/driver_set_bus_active`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        p_bus_id: busId,
        p_active: active,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: DriverServiceError = {
        message:
          errorData.message ||
          `Error al ${active ? 'activar' : 'desactivar'} el bus: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : `Error desconocido al ${active ? 'activar' : 'desactivar'} el bus`,
    );
  }
}

/**
 * Envía la ubicación del vehículo
 */
export async function sendVehiclePosition(
  accessToken: string,
  busId: string,
  location: { lat: number; lng: number },
  tripId: string | null = null,
): Promise<void> {
  if (!REST_URL) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_BACKEND_REST_URL',
    );
  }

  if (!ANON_KEY) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_ANON_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  if (!busId) {
    throw new Error('ID del bus no proporcionado');
  }

  if (
    !location ||
    typeof location.lat !== 'number' ||
    typeof location.lng !== 'number'
  ) {
    throw new Error('Ubicación inválida');
  }

  try {
    const response = await fetch(`${REST_URL}/vehicle_positions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        bus_id: busId,
        trip_id: tripId,
        location_json: {
          lat: location.lat,
          lng: location.lng,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: DriverServiceError = {
        message:
          errorData.message || `Error al enviar ubicación: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al enviar ubicación',
    );
  }
}

/**
 * Actualiza la cantidad de pasajeros del bus
 */
export async function setPassengerCount(
  accessToken: string,
  busId: string,
  count: number,
): Promise<void> {
  if (!REST_URL) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_BACKEND_REST_URL',
    );
  }

  if (!ANON_KEY) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_ANON_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  if (!busId) {
    throw new Error('ID del bus no proporcionado');
  }

  if (typeof count !== 'number' || count < 0) {
    throw new Error('Cantidad de pasajeros inválida');
  }

  try {
    const response = await fetch(`${REST_URL}/rpc/driver_set_passenger_count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        p_bus_id: busId,
        p_passenger_count: count,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: DriverServiceError = {
        message:
          errorData.message ||
          `Error al actualizar cantidad de pasajeros: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al actualizar cantidad de pasajeros',
    );
  }
}
