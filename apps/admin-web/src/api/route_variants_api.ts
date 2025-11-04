// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteVariant {
  id: string;
  route_id: string;
  path: Coordinate[];
  length_m_json?: number;
}

export interface CreateRouteVariantData {
  route_id: string;
  path: Coordinate[];
}

export interface UpdateRouteVariantData {
  path?: Coordinate[];
}

// Obtener todas las variantes de una ruta específica
export async function getRouteVariants(
  routeId: string,
): Promise<RouteVariant[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/route_variants?select=id,route_id,path,length_m_json&route_id=eq.${routeId}`,
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
    const error = await res.text();
    console.error('Error fetching route variants:', error);
    throw new Error('Error al obtener las variantes de la ruta');
  }

  const data: RouteVariant[] = await res.json();
  return data;
}

// Crear una nueva variante de ruta
export async function createRouteVariant(
  variantData: CreateRouteVariantData,
): Promise<RouteVariant> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/route_variants`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(variantData),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Error creating route variant:', error);
    throw new Error('Error al crear la variante de ruta');
  }

  const data: RouteVariant[] = await res.json();
  return data[0];
}

// Actualizar una variante de ruta
export async function updateRouteVariant(
  id: string,
  variantData: UpdateRouteVariantData,
): Promise<RouteVariant> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/route_variants?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(variantData),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error('Error updating route variant:', error);
    throw new Error('Error al actualizar la variante de ruta');
  }

  const data: RouteVariant[] = await res.json();
  return data[0];
}

// Eliminar una variante de ruta
export async function deleteRouteVariant(id: string): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/route_variants?id=eq.${id}`,
    {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error('Error deleting route variant:', error);
    throw new Error('Error al eliminar la variante de ruta');
  }
}
