/**
 * Utilidades para trabajar con rutas y colores
 */

/**
 * Helper para obtener colores de rutas desde CSS variables
 */
export function getRouteColor(variable: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
}
