import type { BusLocation } from '../services/busService';

/**
 * Calcula la distancia entre dos coordenadas geográficas usando la fórmula de Haversine
 * @param lat1 Latitud del primer punto
 * @param lon1 Longitud del primer punto
 * @param lat2 Latitud del segundo punto
 * @param lon2 Longitud del segundo punto
 * @returns Distancia en kilómetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convierte grados a radianes
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula la distancia entre dos ubicaciones
 * @param location1 Primera ubicación
 * @param location2 Segunda ubicación
 * @returns Distancia en kilómetros
 */
export function getDistanceBetweenLocations(
  location1: BusLocation,
  location2: BusLocation,
): number {
  return calculateDistance(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude,
  );
}

/**
 * Formatea la distancia para mostrarla al usuario
 * @param distanceInKm Distancia en kilómetros
 * @returns String formateado (ej: "A 2.5km" o "A 850m")
 */
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    // Si es menor a 1km, mostrar en metros
    const meters = Math.round(distanceInKm * 1000);
    return `A ${meters}m`;
  } else {
    // Si es mayor a 1km, mostrar en kilómetros con 1 decimal
    return `A ${distanceInKm.toFixed(1)}km`;
  }
}
