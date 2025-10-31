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

// Helper para obtener el token del localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

// Helper para obtener el user_id del localStorage
function getUserId(): string | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    return user.id || null;
  } catch {
    return null;
  }
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
  return vehicles.map((vehicle: any) => ({
    ...vehicle,
    passenger_count: vehicle.passenger_count ?? 0,
  }));
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
  const userId = getUserId();

  if (!token) {
    throw new Error(
      'No hay token de autenticación. Por favor inicia sesión nuevamente.',
    );
  }

  console.log('=== CREATE VEHICLE DEBUG ===');
  console.log('User ID from localStorage:', userId);
  console.log('Vehicle data being sent:', JSON.stringify(payload, null, 2));
  console.log(
    'Using token:',
    token ? `${token.substring(0, 20)}...` : 'No token',
  );
  console.log('Full URL:', `${SUPABASE_URL}/rest/v1/buses`);

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

  console.log('=== DELETE VEHICLE DEBUG ===');
  console.log('Vehicle ID:', vehicleId);
  console.log('Full URL:', `${SUPABASE_URL}/rest/v1/buses?id=eq.${vehicleId}`);

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

  console.log('✅ Vehículo eliminado exitosamente');
}
