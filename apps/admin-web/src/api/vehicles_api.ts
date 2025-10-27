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
  last_maintenance: string;
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

// Obtener todas las compañías
export async function getCompanies(): Promise<Company[]> {
  const token = getAuthToken();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,short_name,org_key&order=name.asc`,
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

    // Intentar parsear el error como JSON para mostrar más detalles
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(
        `Create vehicle failed: ${errorJson.message || errorJson.code || errorText}`,
      );
    } catch (e) {
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
