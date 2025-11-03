/**
 * API para gestión de paradas (stops) y su relación con variantes de rutas
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Tipos
export type StopLocation = {
  lat: number;
  lng: number;
};

export type Stop = {
  id: string;
  name: string;
  location: StopLocation;
  created_at?: string;
};

export type StopVariant = {
  stop_id: string;
  variant_id: string;
  stop_order: number;
  created_at?: string;
};

export type StopWithOrder = Stop & {
  stop_order?: number;
};

/**
 * Obtener todas las paradas del sistema
 */
export async function getStops(): Promise<Stop[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/stops?select=id,name,location_json&order=name.asc`,
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
    console.error('Get stops error:', errorText);
    throw new Error(`Get stops failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();

  // Mapear location_json a location
  return data.map(
    (stop: { id: string; name: string; location_json: StopLocation }) => ({
      id: stop.id,
      name: stop.name,
      location: stop.location_json,
    }),
  );
}

/**
 * Crear una nueva parada
 */
export async function createStop(data: {
  name: string;
  location: StopLocation;
}): Promise<Stop> {
  // Mapear location a location_json para la base de datos
  const requestBody = {
    name: data.name,
    location_json: data.location,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/stops`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Create stop error:', errorText);
    throw new Error(`Create stop failed: ${res.status} ${errorText}`);
  }

  const result = await res.json();
  // Mapear location_json a location en la respuesta
  return {
    id: result[0].id,
    name: result[0].name,
    location: result[0].location_json,
  };
}

/**
 * Actualizar una parada existente
 */
export async function updateStop(
  stopId: string,
  data: {
    name?: string;
    location?: StopLocation;
  },
): Promise<Stop> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stops?id=eq.${stopId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Update stop error:', errorText);
    throw new Error(`Update stop failed: ${res.status} ${errorText}`);
  }

  const result = await res.json();
  return result[0];
}

/**
 * Eliminar una parada
 */
export async function deleteStop(stopId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stops?id=eq.${stopId}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Delete stop error:', errorText);
    throw new Error(`Delete stop failed: ${res.status} ${errorText}`);
  }
}

/**
 * Obtener paradas asignadas a una variante específica
 * Usa la vista v_route_variants_agg que ya trae las paradas agregadas
 */
export async function getStopsForVariant(
  variantId: string,
): Promise<StopWithOrder[]> {
  console.log('🔍 Getting stops for variant:', variantId);

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/v_route_variants_agg?variant_id=eq.${variantId}`,
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
    console.error('❌ Get stops for variant error:', errorText);
    throw new Error(`Get stops for variant failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  console.log('📦 Raw data from v_route_variants_agg:', data);

  // La vista ya trae el array de stops directamente
  if (data.length === 0 || !data[0].stops) {
    console.log('⚠️ No stops found for variant');
    return [];
  }

  console.log('✅ Stops from variant:', data[0].stops);

  // Mapear location_json a location y agregar stop_order
  const stopsWithOrder = data[0].stops.map(
    (
      stop: {
        id: string;
        name: string;
        location_json?: StopLocation;
        location?: StopLocation;
      },
      index: number,
    ) => {
      console.log(`🔍 Processing stop ${index + 1}:`, stop);
      return {
        id: stop.id,
        name: stop.name,
        location: stop.location_json || stop.location, // Intentar ambos campos
        stop_order: index + 1,
      };
    },
  );

  console.log('✅ Stops with order:', stopsWithOrder);
  return stopsWithOrder;
}

/**
 * Asignar paradas a una variante de ruta
 * @param variantId ID de la variante de ruta
 * @param stopIds Array de IDs de paradas en el orden deseado
 */
export async function assignStopsToVariant(
  variantId: string,
  stopIds: string[],
): Promise<void> {
  // Primero, eliminar todas las paradas existentes de esta variante
  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/route_variant_stops?variant_id=eq.${variantId}`,
    {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!deleteRes.ok) {
    const errorText = await deleteRes.text();
    console.error('Delete variant stops error:', errorText);
    throw new Error(
      `Delete variant stops failed: ${deleteRes.status} ${errorText}`,
    );
  }

  // Si no hay paradas nuevas, terminar aquí
  if (stopIds.length === 0) {
    return;
  }

  // Luego, insertar las nuevas paradas (el orden está implícito en el array)
  const stopsVariants = stopIds.map((stopId) => ({
    variant_id: variantId,
    stop_id: stopId,
  }));

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/route_variant_stops`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(stopsVariants),
  });

  if (!insertRes.ok) {
    const errorText = await insertRes.text();
    console.error('Insert variant stops error:', errorText);
    throw new Error(
      `Insert variant stops failed: ${insertRes.status} ${errorText}`,
    );
  }
}

/**
 * Remover una parada específica de una variante
 */
export async function removeStopFromVariant(
  variantId: string,
  stopId: string,
): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/route_variant_stops?variant_id=eq.${variantId}&stop_id=eq.${stopId}`,
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
    const errorText = await res.text();
    console.error('Remove stop from variant error:', errorText);
    throw new Error(
      `Remove stop from variant failed: ${res.status} ${errorText}`,
    );
  }
}
