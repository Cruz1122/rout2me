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

  // Configurar parámetros de la solicitud
  const requestBody = {
    shape,
    costing: 'bus', // Usar modo bus para rutas de transporte público
    shape_match: 'map_snap', // Ajustar a las calles
    filters: {
      attributes: ['edge.id', 'edge.length', 'shape'],
      action: 'include',
    },
  };

  try {
    const response = await fetch(
      `https://route.stadiamaps.com/trace_attributes?api_key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      throw new Error(`Map matching failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Extraer la geometría matched
    const matchedShape = data.matched_points || data.trip?.legs?.[0]?.shape;

    if (!matchedShape) {
      throw new Error('No matched geometry returned from API');
    }

    // Decodificar polyline (si viene codificado) o usar directamente
    const coordinates = decodePolyline(matchedShape);

    const matchedGeometry: GeoJSON.LineString = {
      type: 'LineString',
      coordinates,
    };

    return {
      matchedGeometry,
      confidence: data.confidence || 1,
      distance: data.trip?.summary?.length || 0,
      duration: data.trip?.summary?.time || 0,
    };
  } catch (error) {
    console.error('Error in map matching:', error);
    throw error;
  }
}

interface ValhallaPoint {
  lon: number;
  lat: number;
}

/**
 * Decodifica un polyline codificado (formato Google/Valhalla) a coordenadas
 */
function decodePolyline(encoded: string | ValhallaPoint[]): [number, number][] {
  // Si ya viene como array de coordenadas, devolverlo
  if (Array.isArray(encoded)) {
    return encoded.map((point: ValhallaPoint | [number, number]) => {
      if (Array.isArray(point)) return point as [number, number];
      return [point.lon, point.lat];
    });
  }

  // Decodificar polyline string
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

/**
 * Codifica coordenadas a formato polyline para almacenamiento eficiente
 */
export function encodePolyline(coordinates: [number, number][]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lng, lat] of coordinates) {
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);

    const dLat = latE5 - prevLat;
    const dLng = lngE5 - prevLng;

    encoded += encodeValue(dLat);
    encoded += encodeValue(dLng);

    prevLat = latE5;
    prevLng = lngE5;
  }

  return encoded;
}

function encodeValue(value: number): string {
  let encoded = '';
  let num = value < 0 ? ~(value << 1) : value << 1;

  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }

  encoded += String.fromCharCode(num + 63);
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
      return Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);
    }

    const t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    return Math.sqrt((x0 - closestX) ** 2 + (y0 - closestY) ** 2);
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
