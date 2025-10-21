/**
 * Hook personalizado para optimizar el caché del mapa
 * Integra el sistema de caché con MapLibre GL
 */

import { useEffect, useRef, useCallback } from 'react';
import { mapTileCacheService } from '../services/mapTileCacheService';

export interface MapCacheOptions {
  center: [number, number];
  zoom: number;
  preloadRadius?: number;
  preloadZoomLevels?: number[];
}

export function useMapCache(options: MapCacheOptions) {
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Precarga tiles para el área actual del mapa
   */
  const preloadCurrentArea = useCallback(async () => {
    try {
      const {
        center,
        zoom,
        preloadRadius = 2,
        preloadZoomLevels = [zoom - 1, zoom, zoom + 1],
      } = options;

      // Precargar tiles para diferentes niveles de zoom
      for (const z of preloadZoomLevels) {
        if (z >= 5 && z <= 19) {
          await mapTileCacheService.preloadTiles(center, z, preloadRadius);
        }
      }
    } catch (error) {
      console.warn('Error al precargar tiles del mapa:', error);
    }
  }, [options]);

  /**
   * Precarga tiles cuando el mapa cambia de posición
   */
  const preloadOnMove = useCallback(
    (newCenter: [number, number], newZoom: number) => {
      // Cancelar precarga anterior si existe
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }

      // Precargar después de un breve delay para evitar precargas excesivas
      preloadTimeoutRef.current = setTimeout(async () => {
        try {
          await mapTileCacheService.preloadTiles(newCenter, newZoom, 1);
        } catch (error) {
          console.warn('Error al precargar tiles en movimiento:', error);
        }
      }, 1000);
    },
    [],
  );

  /**
   * Optimiza la configuración del mapa para mejor rendimiento
   */
  const getOptimizedMapConfig = useCallback(() => {
    return {
      // Configuración optimizada para caché
      maxTileCacheSize: 200, // Aumentar caché de tiles
      refreshExpiredTiles: false, // No refrescar automáticamente
      fadeDuration: 200, // Animación más rápida
      crossSourceCollisions: false, // Mejor rendimiento

      // Configuración de tiles optimizada
      tileOptions: {
        // Usar múltiples fuentes para balancear carga
        sources: [
          'https://a.basemaps.cartocdn.com/light_all',
          'https://b.basemaps.cartocdn.com/light_all',
          'https://c.basemaps.cartocdn.com/light_all',
        ],
        // Configuración de caché
        cacheControl: 'max-age=86400', // 24 horas
        // Compresión
        compression: true,
      },
    };
  }, []);

  /**
   * Obtiene estadísticas del caché de tiles
   */
  const getTileCacheStats = useCallback(async () => {
    try {
      return await mapTileCacheService.getTileCacheStats();
    } catch (error) {
      console.error('Error al obtener estadísticas de tiles:', error);
      return null;
    }
  }, []);

  /**
   * Limpia el caché de tiles
   */
  const clearTileCache = useCallback(async () => {
    try {
      await mapTileCacheService.clearTileCache();
      console.log('Caché de tiles limpiado');
    } catch (error) {
      console.error('Error al limpiar caché de tiles:', error);
    }
  }, []);

  /**
   * Precarga tiles al montar el componente
   */
  useEffect(() => {
    preloadCurrentArea();
  }, [preloadCurrentArea]);

  /**
   * Limpieza al desmontar
   */
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  return {
    preloadCurrentArea,
    preloadOnMove,
    getOptimizedMapConfig,
    getTileCacheStats,
    clearTileCache,
  };
}
