import type { Bus, BusLocation } from '../services/busService';
import { getDistanceBetweenLocations } from './distanceUtils';

/**
 * Umbral de distancia (en km) para considerar un bus como "cercano"
 */
const NEARBY_THRESHOLD_KM = 1.5; // 1.5 km

/**
 * Obtiene los buses cercanos basado en la ubicación del usuario
 * @param buses Lista de todos los buses
 * @param userLocation Ubicación actual del usuario
 * @param maxDistance Distancia máxima en km para considerar "cercano" (por defecto 1.5km)
 * @returns Lista de buses cercanos y activos
 */
export function getNearbyBuses(
  buses: Bus[],
  userLocation: BusLocation,
  maxDistance: number = NEARBY_THRESHOLD_KM,
): Bus[] {
  return buses.filter((bus) => {
    // Solo considerar buses activos (no offline)
    if (bus.status === 'offline') {
      return false;
    }

    // Calcular distancia
    const distance = getDistanceBetweenLocations(userLocation, bus.location);

    // Retornar true si está dentro del umbral
    return distance <= maxDistance;
  });
}

/**
 * Verifica si un bus específico está cerca del usuario
 * @param bus Bus a verificar
 * @param userLocation Ubicación actual del usuario
 * @param maxDistance Distancia máxima en km (por defecto 1.5km)
 * @returns true si el bus está cerca
 */
export function isBusNearby(
  bus: Bus,
  userLocation: BusLocation,
  maxDistance: number = NEARBY_THRESHOLD_KM,
): boolean {
  if (bus.status === 'offline') {
    return false;
  }

  const distance = getDistanceBetweenLocations(userLocation, bus.location);
  return distance <= maxDistance;
}
