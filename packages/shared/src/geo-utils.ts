import type { LatLng } from './index';

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a coordinate is within bounds
 */
export function isValidCoordinate(point: LatLng): boolean {
  return (
    point.lat >= -90 && point.lat <= 90 && point.lng >= -180 && point.lng <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinate(point: LatLng, precision: number = 4): string {
  return `${point.lat.toFixed(precision)}, ${point.lng.toFixed(precision)}`;
}
