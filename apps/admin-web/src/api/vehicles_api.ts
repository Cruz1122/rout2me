// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'IN_SERVICE'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type Vehicle = {
  id: string;
  company_id: string;
  plate: string;
  capacity: number;
  status: VehicleStatus;
  created_at: string;
  last_maintenance?: string;
  passenger_count: number;
};

export type VehicleCreate = {
  company_id: string;
  plate: string;
  capacity: number;
  status: VehicleStatus;
};

export type Company = {
  id: string;
  name: string;
  short_name: string;
  org_key: string;
};

export type BusLocation = {
  lat: number;
  lng: number;
};

export type BusPosition = {
  bus_id: string;
  plate: string;
  company_id: string;
  status: string;
  active_trip_id: string | null;
  active_route_variant_id: string | null;
  vp_id: string;
  vp_at: string;
  location_json: BusLocation;
  speed_kph: number;
  heading: number;
};

export type RouteStop = {
  id: string;
  name: string;
  location: BusLocation;
};

export type RouteVariant = {
  route_id: string;
  route_code: string;
  route_name: string;
  route_active: boolean;
  variant_id: string;
  path: BusLocation[];
  length_m_json: number;
  stops: RouteStop[];
};

// Helper para obtener el token del localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

// Obtener todas las compañías
export async function getCompanies(): Promise<Company[]> {
  const token = getAuthToken();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,short_name&order=name.asc`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get companies error:', errorText);
    throw new Error(`Get companies failed: ${res.status} ${errorText}`);
  }

  return await res.json();
}

// Obtener todos los vehículos
export async function getVehicles(): Promise<Vehicle[]> {
  const token = getAuthToken();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/buses?select=id,plate,capacity,status,created_at,last_maintenance,passenger_count,company:companies(id,name,short_name)&order=created_at.desc`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get vehicles error:', errorText);
    throw new Error(`Get vehicles failed: ${res.status} ${errorText}`);
  }

  const vehicles = await res.json();

  // Asegurar que passenger_count tenga un valor por defecto de 0
  return vehicles.map(
    (vehicle: {
      id: string;
      company_id: string;
      plate: string;
      capacity: number;
      status: VehicleStatus;
      created_at: string;
      last_maintenance?: string;
      passenger_count?: number;
    }) => ({
      ...vehicle,
      passenger_count: vehicle.passenger_count ?? 0,
    }),
  );
}

// Obtener un vehículo por ID
export async function getVehicleById(id: string): Promise<Vehicle> {
  const token = getAuthToken();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/buses?id=eq.${id}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get vehicle failed: ${res.status} ${text}`);
  }

  const vehicles = await res.json();
  const vehicle = vehicles[0];

  // Asegurar que passenger_count tenga un valor por defecto de 0
  return {
    ...vehicle,
    passenger_count: vehicle.passenger_count ?? 0,
  };
}

// Crear un nuevo vehículo
export async function createVehicle(payload: VehicleCreate): Promise<Vehicle> {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'No hay token de autenticación. Por favor inicia sesión nuevamente.',
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/buses`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Create vehicle error:', errorText);
    console.error('Response status:', res.status);

    // Intentar parsear el error como JSON para mostrar más detalles
    try {
      const errorJson = JSON.parse(errorText);
      console.error('Error details:', errorJson);

      // Si es un error de placa duplicada
      if (errorJson.code === '23505') {
        throw new Error(`La placa ${payload.plate} ya esta registrada.`);
      }

      // Si es un error de RLS, dar un mensaje más claro
      if (errorJson.code === '42501') {
        throw new Error(
          'No tienes permisos para crear vehículos. Verifica que estés autenticado correctamente.',
        );
      }

      throw new Error(
        `Create vehicle failed: ${errorJson.message || errorJson.code || errorText}`,
      );
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes('permisos') || e.message.includes('placa'))
      ) {
        throw e;
      }
      throw new Error(`Create vehicle failed: ${res.status} ${errorText}`);
    }
  }

  const vehicles = await res.json();
  const vehicle = vehicles[0];

  // Asegurar que passenger_count tenga un valor por defecto de 0
  return {
    ...vehicle,
    passenger_count: vehicle.passenger_count ?? 0,
  };
}

// Eliminar un vehículo
export async function deleteVehicle(vehicleId: string): Promise<void> {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'No hay token de autenticación. Por favor inicia sesión nuevamente.',
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/buses?id=eq.${vehicleId}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Delete vehicle error:', errorText);
    console.error('Response status:', res.status);

    try {
      const errorJson = JSON.parse(errorText);
      console.error('Error details:', errorJson);

      // Si es un error de permisos
      if (errorJson.code === '42501') {
        throw new Error('No tienes permisos para eliminar vehículos.');
      }

      throw new Error(
        `Delete vehicle failed: ${errorJson.message || errorJson.code || errorText}`,
      );
    } catch (e) {
      if (e instanceof Error && e.message.includes('permisos')) {
        throw e;
      }
      throw new Error(`Delete vehicle failed: ${res.status} ${errorText}`);
    }
  }
}

// Obtener las posiciones actuales de todos los buses
export async function getBusPositions(): Promise<BusPosition[]> {
  const token = getAuthToken();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/v_bus_latest_positions?select=bus_id,plate,company_id,status,active_trip_id,active_route_variant_id,vp_id,vp_at,location_json,speed_kph,heading&order=plate.asc`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get bus positions error:', errorText);
    throw new Error(`Get bus positions failed: ${res.status} ${errorText}`);
  }

  return await res.json();
}

// Obtener las variantes de rutas con sus paradas
export async function getRouteVariants(): Promise<RouteVariant[]> {
  const token = getAuthToken();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/v_route_variants_agg?select=route_id,route_code,route_name,route_active,variant_id,path,length_m_json,stops&order=route_code.asc,variant_id.asc`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get route variants error:', errorText);
    throw new Error(`Get route variants failed: ${res.status} ${errorText}`);
  }

  return await res.json();
}
