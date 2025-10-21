/**
 * Hook personalizado para gestionar el sistema de caché
 * Proporciona una interfaz React-friendly para los servicios de caché
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheService } from '../services/cacheService';
import { imageCacheService } from '../services/imageCacheService';
import { mapTileCacheService } from '../services/mapTileCacheService';
import { assetPreloader } from '../services/assetPreloader';
import { cacheCleanupService } from '../services/cacheCleanupService';
import { serviceWorkerService } from '../services/serviceWorkerService';

export interface CacheStats {
  totalSize: number;
  totalItems: number;
  imageCache: {
    memoryCacheSize: number;
    diskCacheSize: number;
    diskCacheItems: number;
  };
  tileCache: {
    totalTiles: number;
    totalSize: number;
    averageTileSize: number;
  };
  isCleaning: boolean;
}

export interface UseCacheOptions {
  autoPreload?: boolean;
  preloadConfig?: {
    criticalImages?: string[];
    mapTiles?: {
      center: [number, number];
      zoom: number;
      radius: number;
    };
  };
}

export function useCache(options: UseCacheOptions = {}) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // Cargar estadísticas iniciales
  useEffect(() => {
    loadStats();
  }, []);

  // Configurar precarga automática
  useEffect(() => {
    if (options.autoPreload && options.preloadConfig) {
      assetPreloader.updateConfig(options.preloadConfig);
      startPreload();
    }
  }, [options.autoPreload, options.preloadConfig]);

  // Listener para progreso de precarga
  useEffect(() => {
    const handlePreloadProgress = (event: CustomEvent) => {
      setPreloadProgress(event.detail.progress);
    };

    globalThis.addEventListener(
      'preload-progress',
      handlePreloadProgress as EventListener,
    );

    return () => {
      globalThis.removeEventListener(
        'preload-progress',
        handlePreloadProgress as EventListener,
      );
    };
  }, []);

  /**
   * Carga las estadísticas del caché
   */
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [cacheStats, imageStats, tileStats, cleanupStats] =
        await Promise.all([
          cacheService.getStats(),
          imageCacheService.getImageCacheStats(),
          mapTileCacheService.getTileCacheStats(),
          cacheCleanupService.getCacheStats(),
        ]);

      setStats({
        totalSize: cacheStats.totalSize,
        totalItems: cacheStats.itemCount,
        imageCache: imageStats,
        tileCache: tileStats,
        isCleaning: cleanupStats.isCleaning,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar estadísticas',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Inicia la precarga de assets
   */
  const startPreload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await assetPreloader.preloadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la precarga');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carga una imagen con caché
   */
  const loadImage = useCallback(
    async (
      url: string,
      options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
      } = {},
    ) => {
      try {
        return await imageCacheService.loadImage(url, options);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar imagen');
        throw err;
      }
    },
    [],
  );

  /**
   * Precarga una lista de imágenes
   */
  const preloadImages = useCallback(
    async (
      urls: string[],
      options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
      } = {},
    ) => {
      try {
        setIsLoading(true);
        await imageCacheService.preloadImages(urls, options);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al precargar imágenes',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Precarga tiles de mapa
   */
  const preloadMapTiles = useCallback(
    async (center: [number, number], zoom: number, radius: number = 2) => {
      try {
        setIsLoading(true);
        await mapTileCacheService.preloadTiles(center, zoom, radius);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al precargar tiles',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Limpia el caché
   */
  const clearCache = useCallback(
    async (type?: 'all' | 'images' | 'tiles' | 'data') => {
      try {
        setIsLoading(true);
        setError(null);

        switch (type) {
          case 'images':
            imageCacheService.clearMemoryCache();
            break;
          case 'tiles':
            await mapTileCacheService.clearTileCache();
            break;
          case 'data':
            await cacheService.clear();
            break;
          case 'all':
          default:
            await cacheCleanupService.clearAllCache();
            break;
        }

        // Recargar estadísticas
        await loadStats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al limpiar caché');
      } finally {
        setIsLoading(false);
      }
    },
    [loadStats],
  );

  /**
   * Ejecuta limpieza automática
   */
  const runCleanup = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await cacheCleanupService.performCleanup();

      // Recargar estadísticas
      await loadStats();

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la limpieza');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadStats]);

  /**
   * Registra el Service Worker
   */
  const registerServiceWorker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const registration = await serviceWorkerService.register();

      if (!registration) {
        throw new Error('No se pudo registrar el Service Worker');
      }

      return registration;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al registrar Service Worker',
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Actualiza el Service Worker
   */
  const updateServiceWorker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await serviceWorkerService.updateServiceWorker();

      if (!success) {
        throw new Error('No se pudo actualizar el Service Worker');
      }

      return success;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al actualizar Service Worker',
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtiene información del Service Worker
   */
  const getServiceWorkerInfo = useCallback(() => {
    return serviceWorkerService.getServiceWorkerInfo();
  }, []);

  /**
   * Formatea bytes en formato legible
   */
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  }, []);

  return {
    // Estado
    stats,
    isLoading,
    error,
    preloadProgress,

    // Acciones
    loadStats,
    loadImage,
    preloadImages,
    preloadMapTiles,
    clearCache,
    runCleanup,
    registerServiceWorker,
    updateServiceWorker,
    getServiceWorkerInfo,
    formatBytes,
  };
}
