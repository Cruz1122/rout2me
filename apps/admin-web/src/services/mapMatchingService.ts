export interface MapMatchingResponse {
  matchedGeometry: GeoJSON.LineString;
  confidence: number;
  distance: number; // distancia total en metros
  duration: number; // duración en segundos
}

interface ValhallaPoint {
  lat: number;
  lon: number;
}

interface ValhallaEdge {
  shape: string;
}

/**
 * Llama al Map Matching API de Stadia Maps para ajustar una ruta a las calles reales
 */
export async function matchRouteToRoads(
  points: [number, number][],
  apiKey: string,
): Promise<MapMatchingResponse> {
  // Convertir puntos a formato Valhalla
  const shape = points.map(([lon, lat]) => ({
    lat,
    lon,
  }));

  // Configurar parámetros de la solicitud
  const requestBody = {
    shape,
    costing: 'bus', // Usar modo bus para rutas de transporte público
    shape_match: 'map_snap', // Algoritmo de ajuste
    costing_options: {
      bus: {
        use_bus_routes: 1, // Preferir rutas de bus
      },
    },
  };

  const response = await fetch(
    `https://route.stadiamaps.com/trace_route?api_key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Map matching failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  // trace_route devuelve la geometría en data.trip.legs[0].shape
  const matchedShape =
    data.trip?.legs?.[0]?.shape || data.shape || data.matched_points;

  if (!matchedShape) {
    throw new Error('No matched geometry returned from API');
  }

  // Decodificar polyline
  const coordinates = decodePolyline(matchedShape);

  const matchedGeometry: GeoJSON.LineString = {
    type: 'LineString',
    coordinates,
  };

  // Extraer métricas del trip.summary
  const summary = data.trip?.summary || {};
  return {
    matchedGeometry,
    confidence: data.confidence || 1,
    distance: summary.length || 0,
    duration: summary.time || 0,
  };
}

/**
 * Procesa una ruta que ya tiene coordenadas del backend
 * Aplica map matching opcional para refinar la ruta
 */
export async function processRouteWithCoordinates(
  coordinates: [number, number][],
  apiKey?: string,
  applyMapMatching: boolean = false,
): Promise<MapMatchingResponse> {
  // Si no se debe aplicar map matching o no hay API key, devolver las coordenadas originales
  if (!applyMapMatching || !apiKey) {
    return {
      matchedGeometry: {
        type: 'LineString',
        coordinates,
      },
      confidence: 1,
      distance: calculateRouteDistance(coordinates),
      duration: calculateRouteDuration(coordinates),
    };
  }

  // Aplicar map matching para refinar la ruta
  try {
    return await matchRouteToRoads(coordinates, apiKey);
  } catch (error) {
    console.warn('Map matching failed, using original coordinates:', error);
    return {
      matchedGeometry: {
        type: 'LineString',
        coordinates,
      },
      confidence: 0.8,
      distance: calculateRouteDistance(coordinates),
      duration: calculateRouteDuration(coordinates),
    };
  }
}

/**
 * Decodifica un polyline codificado (formato Google/Valhalla) a coordenadas
 */
function decodePolyline(
  encoded: string | ValhallaPoint[] | ValhallaEdge[],
): [number, number][] {
  if (Array.isArray(encoded)) {
    if (encoded.length > 0 && 'shape' in encoded[0]) {
      return processEdges(encoded as ValhallaEdge[]);
    }
    return processPoints(encoded as ValhallaPoint[]);
  }
  return decodePolylineString(encoded);
}

function decodePolylineString(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  const index = { current: 0 };
  let lat = 0;
  let lng = 0;

  while (index.current < encoded.length) {
    const dlat = decodeValue(encoded, index);
    lat += dlat;

    const dlng = decodeValue(encoded, index);
    lng += dlng;

    // Valhalla usa precisión 6 (1e6)
    coordinates.push([lng / 1e6, lat / 1e6]);
  }

  return coordinates;
}

function decodeValue(encoded: string, index: { current: number }): number {
  let b;
  let shift = 0;
  let result = 0;

  do {
    b = (encoded.codePointAt(index.current++) ?? 0) - 63;
    result |= (b & 0x1f) << shift;
    shift += 5;
  } while (b >= 0x20);

  return (result & 1) === 0 ? result >> 1 : ~(result >> 1);
}

function processPoints(points: ValhallaPoint[]): [number, number][] {
  return points.map((point) => [point.lon, point.lat]);
}

function processEdges(edges: ValhallaEdge[]): [number, number][] {
  const allCoordinates: [number, number][] = [];

  for (const edge of edges) {
    const coordinates = decodePolylineString(edge.shape);
    allCoordinates.push(...coordinates);
  }

  return allCoordinates;
}

function calculateRouteDistance(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    totalDistance += calculateDistanceBetweenPoints(lat1, lng1, lat2, lng2);
  }

  return totalDistance;
}

function calculateRouteDuration(coordinates: [number, number][]): number {
  const distance = calculateRouteDistance(coordinates);
  const averageSpeedKmh = 25; // 25 km/h promedio para transporte público
  const averageSpeedMs = averageSpeedKmh / 3.6;
  return Math.round(distance / averageSpeedMs);
}

function calculateDistanceBetweenPoints(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
