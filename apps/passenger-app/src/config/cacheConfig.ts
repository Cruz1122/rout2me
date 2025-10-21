/**
 * Configuración del sistema de caché para Rout2Me
 * Centraliza todas las configuraciones relacionadas con el caché
 */

export interface CacheConfig {
  // Configuración general
  maxSize: number;
  maxAge: number;
  autoCleanup: boolean;
  cleanupInterval: number;
  cleanupThreshold: number;

  // Configuración de imágenes
  imageCache: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'webp' | 'jpeg' | 'png';
    memoryCacheSize: number;
  };

  // Configuración de tiles de mapa
  tileCache: {
    maxZoom: number;
    minZoom: number;
    tileSize: number;
    preloadRadius: number;
    sources: string[];
  };

  // Configuración de precarga
  preload: {
    enabled: boolean;
    criticalImages: string[];
    mapTiles: {
      center: [number, number];
      zoom: number;
      radius: number;
    };
    fonts: string[];
    icons: string[];
  };

  // Configuración de Service Worker
  serviceWorker: {
    enabled: boolean;
    swPath: string;
    scope: string;
    updateCheckInterval: number;
  };
}

// Configuración por defecto optimizada para conexiones lentas
export const defaultCacheConfig: CacheConfig = {
  // Configuración general
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 horas
  cleanupThreshold: 0.8, // 80% de uso

  // Configuración de imágenes
  imageCache: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: 'webp',
    memoryCacheSize: 50, // 50 elementos en memoria
  },

  // Configuración de tiles de mapa
  tileCache: {
    maxZoom: 19,
    minZoom: 5,
    tileSize: 256,
    preloadRadius: 2,
    sources: [
      'https://a.basemaps.cartocdn.com/light_all',
      'https://b.basemaps.cartocdn.com/light_all',
      'https://c.basemaps.cartocdn.com/light_all',
    ],
  },

  // Configuración de precarga
  preload: {
    enabled: true,
    criticalImages: [
      // Agregar aquí las imágenes críticas de la aplicación
    ],
    mapTiles: {
      center: [-75.5138, 5.0703], // Manizales
      zoom: 15,
      radius: 2,
    },
    fonts: [
      // Agregar aquí las fuentes críticas
    ],
    icons: [
      // Agregar aquí los iconos críticos
    ],
  },

  // Configuración de Service Worker
  serviceWorker: {
    enabled: true,
    swPath: '/sw.js',
    scope: '/',
    updateCheckInterval: 60 * 1000, // 1 minuto
  },
};

// Configuración para conexiones lentas
export const slowConnectionConfig: CacheConfig = {
  ...defaultCacheConfig,
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  cleanupInterval: 12 * 60 * 60 * 1000, // 12 horas
  cleanupThreshold: 0.7, // 70% de uso

  imageCache: {
    ...defaultCacheConfig.imageCache,
    maxWidth: 400,
    maxHeight: 300,
    quality: 0.6,
    format: 'webp',
    memoryCacheSize: 25,
  },

  tileCache: {
    ...defaultCacheConfig.tileCache,
    preloadRadius: 1,
  },
};

// Configuración para conexiones rápidas
export const fastConnectionConfig: CacheConfig = {
  ...defaultCacheConfig,
  maxSize: 200 * 1024 * 1024, // 200MB
  maxAge: 60 * 24 * 60 * 60 * 1000, // 60 días
  cleanupInterval: 48 * 60 * 60 * 1000, // 48 horas
  cleanupThreshold: 0.9, // 90% de uso

  imageCache: {
    ...defaultCacheConfig.imageCache,
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.9,
    format: 'webp',
    memoryCacheSize: 100,
  },

  tileCache: {
    ...defaultCacheConfig.tileCache,
    preloadRadius: 3,
  },
};

// Detectar tipo de conexión y devolver configuración apropiada
export function getCacheConfigForConnection(): CacheConfig {
  // Detectar si es una conexión lenta
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g'
    ) {
      return slowConnectionConfig;
    }
    if (connection.effectiveType === '4g' && connection.downlink > 2) {
      return fastConnectionConfig;
    }
  }

  // Configuración por defecto
  return defaultCacheConfig;
}

// Configuración personalizada por el usuario
export function createCustomConfig(
  overrides: Partial<CacheConfig>,
): CacheConfig {
  return {
    ...defaultCacheConfig,
    ...overrides,
  };
}
