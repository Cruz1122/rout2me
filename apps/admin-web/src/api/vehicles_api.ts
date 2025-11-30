// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'IN_SERVICE'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type VehicleType = 'BUS' | 'BUSETA' | 'MICROBUS';

export type Vehicle = {
  id: string;
  company_name?: string;
  company_id: string;
  plate: string;
  capacity: number;
  status: VehicleStatus;
  type?: VehicleType;
  has_ramp?: boolean;
  created_at: string;
  last_maintenance?: string;
  passenger_count: number;
  // Nuevos campos de v_bus_latest_positions
  active_trip_id: string | null;
  active_route_variant_id: string | null;
  vp_id: string | null;
  vp_at: string | null;
  location_json: BusLocation | null;
  speed_kph: number | null;
  heading: number | null;
};

export type VehicleCreate = {
  company_id: string;
  plate: string;
  capacity: number;
  status: VehicleStatus;
  type: VehicleType;
  has_ramp: boolean;
  passenger_count?: number;
};

export type VehicleUpdate = {
  capacity: number;
  status: VehicleStatus;
  type: VehicleType;
  has_ramp: boolean;
  last_maintenance?: string;
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

export type Route = {
  id: string;
  code: string;
  name: string;
  active: boolean;
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

// Obtener todos los vehículos con información extendida
export async function getVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/v_bus_latest_positions`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get vehicles error:', errorText);
    throw new Error(`Get vehicles failed: ${res.status} ${errorText}`);
  }

  const vehicles = await res.json();

  // Mapear la respuesta al formato Vehicle esperado
  return vehicles.map(
    (vehicle: {
      bus_id: string;
      plate: string;
      company_id: string;
      company_name?: string;
      status: VehicleStatus;
      capacity: number;
      passenger_count: number | null;
      type: string;
      has_ramp: boolean;
      last_maintenance: string;
      bus_created_at: string;
      active_trip_id: string | null;
      active_route_variant_id: string | null;
      vp_id: string | null;
      vp_at: string | null;
      location_json: BusLocation | null;
      speed_kph: number | null;
      heading: number | null;
    }) => ({
      id: vehicle.bus_id,
      company_name: vehicle.company_name,
      company_id: vehicle.company_id,
      plate: vehicle.plate,
      capacity: vehicle.capacity,
      status: vehicle.status,
      type: vehicle.type?.toUpperCase() as VehicleType,
      has_ramp: vehicle.has_ramp,
      created_at: vehicle.bus_created_at,
      last_maintenance: vehicle.last_maintenance,
      passenger_count: vehicle.passenger_count ?? 0,
      active_trip_id: vehicle.active_trip_id,
      active_route_variant_id: vehicle.active_route_variant_id,
      vp_id: vehicle.vp_id,
      vp_at: vehicle.vp_at,
      location_json: vehicle.location_json,
      speed_kph: vehicle.speed_kph,
      heading: vehicle.heading,
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
    body: JSON.stringify({
      ...payload,
      type: payload.type.toLowerCase(),
    }),
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

// Actualizar un vehículo existente
export async function updateVehicle(
  id: string,
  payload: VehicleUpdate,
): Promise<Vehicle> {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'No hay token de autenticación. Por favor inicia sesión nuevamente.',
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/buses?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      ...payload,
      type: payload.type.toLowerCase(),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Update vehicle error:', errorText);

    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(
        `Update vehicle failed: ${errorJson.message || errorJson.code || errorText}`,
      );
    } catch (e) {
      if (e instanceof Error && e.message.includes('Update vehicle failed')) {
        throw e;
      }
      throw new Error(`Update vehicle failed: ${res.status} ${errorText}`);
    }
  }

  const vehicles = await res.json();
  const vehicle = vehicles[0];

  // Mapear la respuesta para asegurar que tenga todos los campos necesarios
  return {
    id: vehicle.bus_id || vehicle.id,
    company_name: vehicle.company_name,
    company_id: vehicle.company_id,
    plate: vehicle.plate,
    capacity: vehicle.capacity,
    status: vehicle.status,
    type: vehicle.type?.toUpperCase() as VehicleType,
    has_ramp: vehicle.has_ramp,
    created_at: vehicle.bus_created_at || vehicle.created_at,
    last_maintenance: vehicle.last_maintenance,
    passenger_count: vehicle.passenger_count ?? 0,
    active_trip_id: vehicle.active_trip_id || null,
    active_route_variant_id: vehicle.active_route_variant_id || null,
    vp_id: vehicle.vp_id || null,
    vp_at: vehicle.vp_at || null,
    location_json: vehicle.location_json || null,
    speed_kph: vehicle.speed_kph ?? null,
    heading: vehicle.heading ?? null,
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/v_bus_latest_positions`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get bus positions error:', errorText);
    throw new Error(`Get bus positions failed: ${res.status} ${errorText}`);
  }

  return await res.json();
}

// Obtener las variantes de rutas con sus paradas
export async function getRouteVariants(): Promise<RouteVariant[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/v_route_variants_agg?select=route_id,route_code,route_name,route_active,variant_id,path,length_m_json,stops&order=route_code.asc,variant_id.asc`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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

// Obtener todas las rutas
export async function getRoutes(): Promise<Route[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/v_route_variants_agg?select=route_id,route_code,route_name,route_active&order=route_code.asc`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get routes error:', errorText);
    throw new Error(`Get routes failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();

  // Remover duplicados agrupando por route_id
  const uniqueRoutes = Array.from(
    new Map(
      data.map(
        (item: {
          route_id: string;
          route_code: string;
          route_name: string;
          route_active: boolean;
        }) => [
          item.route_id,
          {
            id: item.route_id,
            code: item.route_code,
            name: item.route_name,
            active: item.route_active,
          },
        ],
      ),
    ).values(),
  ) as Route[];

  return uniqueRoutes;
}

// Obtener variantes de una ruta específica
export async function getRouteVariantsByRouteId(
  routeId: string,
): Promise<RouteVariant[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/v_route_variants_agg?select=route_id,route_code,route_name,route_active,variant_id,path,length_m_json,stops&route_id=eq.${routeId}&order=variant_id.asc`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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

// Asignar ruta activa a un bus
export async function assignRouteToVehicle(
  busId: string,
  routeVariantId: string,
  hasActiveTrip: boolean = false,
): Promise<void> {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'No hay token de autenticación. Por favor inicia sesión nuevamente.',
    );
  }

  // Si el bus ya tiene un trip activo, actualizamos la ruta
  if (hasActiveTrip) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_trip_route`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        _bus_id: busId,
        _new_route_variant_id: routeVariantId,
        _mode: 'switch',
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Update trip route error:', errorText);
      throw new Error(`Error al actualizar ruta: ${res.status} ${errorText}`);
    }
  } else {
    // Si no tiene un trip activo, creamos uno nuevo
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_trip`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        _bus_id: busId,
        _route_variant_id: routeVariantId,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Create trip error:', errorText);
      throw new Error(`Error al crear trip: ${res.status} ${errorText}`);
    }
  }
}

// Remover ruta activa de un bus (terminar el trip)
export async function removeRouteFromVehicle(busId: string): Promise<void> {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'No hay token de autenticación. Por favor inicia sesión nuevamente.',
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/end_active_trip`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      _bus_id: busId,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('End trip error:', errorText);
    throw new Error(`Error al terminar trip: ${res.status} ${errorText}`);
  }
}
