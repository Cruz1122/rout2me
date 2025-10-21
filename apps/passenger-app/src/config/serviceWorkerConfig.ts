/**
 * Configuración del Service Worker
 * Permite habilitar/deshabilitar el SW según el entorno
 */

export interface ServiceWorkerConfig {
  enabled: boolean;
  swPath: string;
  scope: string;
  updateCheckInterval: number;
  skipInDevelopment: boolean;
  skipForWebSocket: boolean;
  skipForVite: boolean;
}

// Configuración por defecto
export const defaultServiceWorkerConfig: ServiceWorkerConfig = {
  enabled: true,
  swPath: '/sw.js',
  scope: '/',
  updateCheckInterval: 60 * 1000, // 1 minuto
  skipInDevelopment: true,
  skipForWebSocket: true,
  skipForVite: true,
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

// Detectar si el Service Worker debe estar habilitado
export function shouldEnableServiceWorker(): boolean {
  const config = defaultServiceWorkerConfig;

  // Deshabilitar en desarrollo si está configurado
  if (config.skipInDevelopment && isDevelopment()) {
    return false;
  }

  // Verificar soporte del navegador
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  // Verificar HTTPS (requerido para SW en producción)
  if (!isDevelopment() && !window.location.protocol.startsWith('https')) {
    return false;
  }

  return config.enabled;
}

// Obtener configuración del Service Worker
export function getServiceWorkerConfig(): ServiceWorkerConfig {
  return {
    ...defaultServiceWorkerConfig,
    enabled: shouldEnableServiceWorker(),
  };
}
