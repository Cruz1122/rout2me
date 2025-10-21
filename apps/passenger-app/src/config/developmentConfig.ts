/**
 * Configuración para desarrollo
 * Deshabilita ciertas funcionalidades que pueden causar problemas en desarrollo
 */

export interface DevelopmentConfig {
  disableServiceWorker: boolean;
  disableCache: boolean;
  enableDebugLogs: boolean;
  skipWebSocketCaching: boolean;
  skipViteResources: boolean;
}

// Configuración por defecto para desarrollo
export const developmentConfig: DevelopmentConfig = {
  disableServiceWorker: true,
  disableCache: false, // Mantener caché para probar funcionalidad
  enableDebugLogs: true,
  skipWebSocketCaching: true,
  skipViteResources: true,
};

// Detectar si estamos en desarrollo
export function isDevelopment(): boolean {
  return (
    import.meta.env.DEV ||
    import.meta.env.MODE === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

// Obtener configuración según el entorno
export function getDevelopmentConfig(): DevelopmentConfig {
  if (isDevelopment()) {
    return developmentConfig;
  }

  // Configuración para producción
  return {
    disableServiceWorker: false,
    disableCache: false,
    enableDebugLogs: false,
    skipWebSocketCaching: true,
    skipViteResources: true,
  };
}

// Verificar si el Service Worker debe estar deshabilitado
export function shouldDisableServiceWorker(): boolean {
  const config = getDevelopmentConfig();
  return config.disableServiceWorker && isDevelopment();
}

// Verificar si el caché debe estar deshabilitado
export function shouldDisableCache(): boolean {
  const config = getDevelopmentConfig();
  return config.disableCache && isDevelopment();
}

// Verificar si los logs de debug deben estar habilitados
export function shouldEnableDebugLogs(): boolean {
  const config = getDevelopmentConfig();
  return config.enableDebugLogs;
}
