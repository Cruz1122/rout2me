import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Utilidad para verificar permisos de localización de forma rápida y eficiente
 * Usa la API de Permissions cuando está disponible, con fallback a geolocation
 * En Android nativo, usa el plugin de Capacitor para verificar permisos sin solicitarlos
 */

/**
 * Verifica permisos de localización usando la API de Permissions (más rápida y no solicita)
 * @returns Promise que resuelve con el estado del permiso
 */
async function checkWithPermissionsAPI(): Promise<boolean | null> {
  if (!('permissions' in navigator)) {
    return null; // API no disponible
  }

  try {
    // La API de Permissions puede tener diferentes implementaciones
    const permissions = navigator.permissions as Permissions;
    const result = await permissions.query({
      name: 'geolocation',
    } as PermissionDescriptor);

    // El estado puede ser 'granted', 'denied', o 'prompt'
    if (result.state === 'granted') {
      return true;
    }
    if (result.state === 'denied') {
      return false;
    }
    // Si es 'prompt', el usuario aún no ha decidido, pero no queremos solicitar aquí
    // Retornamos null para que se use otra estrategia
    return null;
  } catch (error) {
    // La API de Permissions puede no estar disponible en todos los navegadores
    // o puede fallar en Android, así que simplemente retornamos null para usar fallback
    console.warn('Error al verificar permisos con Permissions API:', error);
    return null;
  }
}

/**
 * Clave para almacenar el estado de permisos en localStorage
 */
const PERMISSION_STORAGE_KEY = 'rout2me_location_permission_granted';

/**
 * Obtiene el estado de permisos guardado en localStorage
 */
function getStoredPermissionState(): boolean | null {
  try {
    const stored = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (stored === null) return null;
    return stored === 'true';
  } catch {
    return null;
  }
}

/**
 * Guarda el estado de permisos en localStorage
 */
function setStoredPermissionState(hasPermission: boolean): void {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, String(hasPermission));
  } catch {
    // Ignorar errores de localStorage
  }
}

/**
 * Verifica permisos usando el plugin nativo de Capacitor (solo Android/iOS)
 * Este método verifica permisos sin solicitarlos
 * @returns Promise que resuelve con el estado del permiso
 */
async function checkWithCapacitorNative(): Promise<boolean | null> {
  // Solo usar en plataformas nativas
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    // El plugin de Geolocation tiene un método checkPermissions que verifica sin solicitar
    const result = await Geolocation.checkPermissions();

    // El resultado tiene una propiedad 'location' que puede ser 'granted', 'denied', o 'prompt'
    if (result.location === 'granted') {
      return true;
    }
    if (result.location === 'denied') {
      return false;
    }
    // Si es 'prompt', el usuario aún no ha decidido
    return false;
  } catch (error) {
    console.warn('Error al verificar permisos con Capacitor:', error);
    return null;
  }
}

/**
 * En Android, si la API de Permissions no está disponible y Capacitor falla,
 * usar el estado guardado como último recurso
 * @returns Promise que resuelve con el estado del permiso
 */
function checkWithStoredState(): Promise<boolean> {
  // Verificar si tenemos un estado guardado
  const storedState = getStoredPermissionState();
  if (storedState !== null) {
    // Si tenemos un estado guardado, usarlo
    // Nota: esto puede no ser 100% confiable si el usuario cambió permisos
    // pero evita solicitar permisos innecesariamente
    return Promise.resolve(storedState);
  }

  // Si no tenemos estado guardado, asumir que no hay permisos
  // Esto evitará solicitar permisos automáticamente
  // El usuario verá la página de permisos y ahí se solicitarán
  return Promise.resolve(false);
}

/**
 * Verifica permisos de localización usando geolocation (solo para web, no Android)
 * En Android, esto puede solicitar permisos, así que solo se usa en web
 * @param timeout Tiempo máximo de espera en milisegundos
 * @returns Promise que resuelve con el estado del permiso
 */
function checkWithGeolocation(timeout: number = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    // Usar timeout más corto para verificación rápida
    navigator.geolocation.getCurrentPosition(
      () => {
        // Si podemos obtener la ubicación, tenemos permisos
        resolve(true);
      },
      (error) => {
        // Si hay un error, verificar el código
        if (error.code === 1) {
          // PERMISSION_DENIED
          resolve(false);
        } else {
          // Otros errores (timeout, unavailable) - asumir que no hay permisos
          // pero podría ser un problema temporal
          resolve(false);
        }
      },
      {
        timeout,
        maximumAge: 60000, // Permitir caché de hasta 1 minuto para verificación más rápida
        enableHighAccuracy: false, // No necesitamos alta precisión para verificar permisos
      },
    );
  });
}

/**
 * Verifica si el usuario tiene permisos de localización
 * Usa la API de Permissions cuando está disponible (más rápida y no solicita)
 * En Android, usa localStorage para evitar solicitar permisos innecesariamente
 * @param fastCheck Si es true, usa timeout más corto (útil para verificación inicial)
 * @returns Promise que resuelve con el estado del permiso
 */
export async function checkLocationPermission(
  fastCheck: boolean = false,
): Promise<boolean> {
  const isNative = Capacitor.isNativePlatform();

  // En plataformas nativas (Android/iOS), usar el plugin de Capacitor primero
  if (isNative) {
    const nativeResult = await checkWithCapacitorNative();
    if (nativeResult !== null) {
      // Guardar el estado si tenemos un resultado
      setStoredPermissionState(nativeResult);
      return nativeResult;
    }
  }

  // Intentar con la API de Permissions del navegador (más rápida y no solicita)
  const permissionsResult = await checkWithPermissionsAPI();

  if (permissionsResult !== null) {
    // Guardar el estado si tenemos un resultado
    setStoredPermissionState(permissionsResult);
    return permissionsResult;
  }

  // En Android nativo, si ambas verificaciones fallaron, usar el estado guardado
  if (isNative) {
    return await checkWithStoredState();
  }

  // En web, usar geolocation normal como fallback
  const timeout = fastCheck ? 1000 : 3000;
  const result = await checkWithGeolocation(timeout);
  // Guardar el resultado para futuras verificaciones
  setStoredPermissionState(result);
  return result;
}

/**
 * Marca que los permisos fueron otorgados (para guardar en localStorage)
 * Debe llamarse cuando el usuario otorga permisos explícitamente
 */
export function markPermissionGranted(): void {
  setStoredPermissionState(true);
}

/**
 * Marca que los permisos fueron denegados (para guardar en localStorage)
 * Debe llamarse cuando el usuario deniega permisos explícitamente
 */
export function markPermissionDenied(): void {
  setStoredPermissionState(false);
}
