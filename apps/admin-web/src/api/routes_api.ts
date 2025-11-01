// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export interface Route {
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at?: string;
}

export interface CreateRouteData {
  code: string;
  name: string;
  active: boolean;
}

export interface UpdateRouteData {
  code?: string;
  name?: string;
  active?: boolean;
}

// Obtener todas las rutas
export async function getRoutes(): Promise<Route[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/routes`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Error fetching routes:', error);
    throw new Error('Error al obtener las rutas');
  }

  const data: Route[] = await res.json();
  return data;
}

// Crear una nueva ruta
export async function createRoute(routeData: CreateRouteData): Promise<Route> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/routes`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(routeData),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Error creating route:', error);
    throw new Error('Error al crear la ruta');
  }

  const data: Route[] = await res.json();
  return data[0];
}

// Actualizar una ruta
export async function updateRoute(
  id: string,
  routeData: UpdateRouteData,
): Promise<Route> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/routes?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(routeData),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Error updating route:', error);
    throw new Error('Error al actualizar la ruta');
  }

  const data: Route[] = await res.json();
  return data[0];
}

// Eliminar una ruta
export async function deleteRoute(id: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/routes?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Error deleting route:', error);
    throw new Error('Error al eliminar la ruta');
  }
}
