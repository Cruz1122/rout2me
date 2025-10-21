/**
 * Servicio para Map Matching usando Stadia Maps API (basado en Valhalla)
 * Convierte coordenadas dibujadas en rutas ajustadas a la red vial
 */

export interface MapMatchingPoint {
  lat: number;
  lon: number;
}

export interface MapMatchingResponse {
  matchedGeometry: GeoJSON.LineString;
  confidence: number;
  distance: number; // distancia total en metros
  duration: number; // duración en segundos
}

/**
 * Llama al Map Matching API de Stadia Maps para ajustar una ruta dibujada a las calles reales
 * @param points Array de puntos [lng, lat] dibujados en el mapa
 * @param apiKey API key de Stadia Maps
 * @returns Geometría ajustada y metadatos
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

  // Configurar parámetros de la solicitud para ajuste ESTRICTO a calles
  const requestBody = {
    shape,
    costing: 'bus', // Usar modo bus para rutas de transporte público
    shape_match: 'map_snap', // Algoritmo de ajuste
    // Configuración específica para el modo de costing
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

  // Decodificar polyline (si viene codificado) o usar directamente
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
    distance: summary.length || 0, // distancia en kilómetros
    duration: summary.time || 0, // duración en segundos
  };
}

interface ValhallaPoint {
  lon: number;
  lat: number;
}

interface ValhallaEdge {
  shape: string | ValhallaPoint[];
}

/**
 * Procesa un array de edges con shapes internos
 */
function processEdges(edges: ValhallaEdge[]): [number, number][] {
  const allCoords: [number, number][] = [];
  for (const edge of edges) {
    const edgeCoords = decodePolyline(edge.shape);
    allCoords.push(...edgeCoords);
  }
  return allCoords;
}

/**
 * Procesa un array de puntos ValhallaPoint
 */
function processPoints(points: ValhallaPoint[]): [number, number][] {
  return points.map((point) => [point.lon, point.lat]);
}

/**
 * Decodifica un valor individual del polyline
 */
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

/**
 * Decodifica un polyline string a coordenadas
 */
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

    // Valhalla usa precisión 6 (1e6) en lugar de precisión 5 (1e5)
    coordinates.push([lng / 1e6, lat / 1e6]);
  }

  return coordinates;
}

/**
 * Decodifica un polyline codificado (formato Google/Valhalla) a coordenadas
 */
function decodePolyline(
  encoded: string | ValhallaPoint[] | ValhallaEdge[],
): [number, number][] {
  // Si ya viene como array, procesarlo
  if (Array.isArray(encoded)) {
    // Si es array de edges (cada edge tiene un shape)
    if (encoded.length > 0 && 'shape' in encoded[0]) {
      return processEdges(encoded as ValhallaEdge[]);
    }

    // Si es array de puntos ValhallaPoint
    return processPoints(encoded as ValhallaPoint[]);
  }

  // Decodificar polyline string
  return decodePolylineString(encoded);
}

/**
 * Codifica coordenadas a formato polyline para almacenamiento eficiente
 * Usa precisión 6 (1e6) para ser compatible con Valhalla/Stadia Maps
 */
export function encodePolyline(coordinates: [number, number][]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lng, lat] of coordinates) {
    // Valhalla usa precisión 6 (1e6) en lugar de precisión 5 (1e5)
    const latE6 = Math.round(lat * 1e6);
    const lngE6 = Math.round(lng * 1e6);

    const dLat = latE6 - prevLat;
    const dLng = lngE6 - prevLng;

    encoded += encodeValue(dLat);
    encoded += encodeValue(dLng);

    prevLat = latE6;
    prevLng = lngE6;
  }

  return encoded;
}

function encodeValue(value: number): string {
  let encoded = '';
  let num = value < 0 ? ~(value << 1) : value << 1;

  while (num >= 0x20) {
    encoded += String.fromCodePoint((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }

  encoded += String.fromCodePoint(num + 63);
  return encoded;
}

/**
 * Simplifica una geometría para almacenamiento más eficiente
 * usando el algoritmo Douglas-Peucker
 */
export function simplifyGeometry(
  coordinates: [number, number][],
  tolerance: number = 0.00001,
): [number, number][] {
  if (coordinates.length <= 2) return coordinates;

  const perpendicularDistance = (
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number],
  ): number => {
    const [x0, y0] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      return Math.hypot(x0 - x1, y0 - y1);
    }

    const t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    return Math.hypot(x0 - closestX, y0 - closestY);
  };

  const douglasPeucker = (
    points: [number, number][],
    epsilon: number,
  ): [number, number][] => {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const distance = perpendicularDistance(points[i], points[0], points[end]);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > epsilon) {
      const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const right = douglasPeucker(points.slice(maxIndex), epsilon);
      return [...left.slice(0, -1), ...right];
    }

    return [points[0], points[end]];
  };

  return douglasPeucker(coordinates, tolerance);
}
