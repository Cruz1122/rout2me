/**
 * Servicio de precarga de assets críticos
 * Mejora la experiencia de usuario precargando recursos importantes
 */

import { imageCacheService } from '../../../shared/services/imageCacheService';
import { mapTileCacheService } from '../../routes/services/mapTileCacheService';

export interface PreloadConfig {
  criticalImages: string[];
  mapTiles: {
    center: [number, number];
    zoom: number;
    radius: number;
  };
  fonts: string[];
  icons: string[];
}

export class AssetPreloader {
  private static instance: AssetPreloader;
  private preloadConfig: PreloadConfig;
  private isPreloading = false;
  private preloadProgress = 0;

  constructor(config: PreloadConfig) {
    this.preloadConfig = config;
  }

  static getInstance(config?: PreloadConfig): AssetPreloader {
    if (!AssetPreloader.instance) {
      AssetPreloader.instance = new AssetPreloader(
        config || {
          criticalImages: [],
          mapTiles: {
            center: [-75.5138, 5.0703], // Manizales por defecto
            zoom: 15,
            radius: 2,
          },
          fonts: [],
          icons: [],
        },
      );
    }
    return AssetPreloader.instance;
  }

  /**
   * Helper para agregar timeout a promesas
   */
  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
      ),
    ]);
  }

  /**
   * Verifica si hay conexión a internet
   */
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true; // Asumir online si no se puede verificar
  }

  /**
   * Inicia la precarga de todos los assets críticos (no bloqueante)
   */
  async preloadAll(): Promise<void> {
    if (this.isPreloading) {
      return;
    }

    this.isPreloading = true;
    this.preloadProgress = 0;

    try {
      // Verificar conexión antes de precargar
      if (!this.isOnline()) {
        console.log('Sin conexión, omitiendo precarga de assets');
        this.preloadProgress = 100;
        return;
      }

      const tasks = [
        this.preloadCriticalImages(),
        this.preloadMapTiles(),
        this.preloadFonts(),
        this.preloadIcons(),
      ];

      // Ejecutar todas las tareas en paralelo con timeouts individuales
      await Promise.allSettled(tasks);

      this.preloadProgress = 100;
      console.log('Precarga de assets completada');
    } catch (error) {
      console.warn('Error durante la precarga (no crítico):', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Precarga imágenes críticas
   */
  private async preloadCriticalImages(): Promise<void> {
    if (this.preloadConfig.criticalImages.length === 0) {
      return;
    }

    try {
      await this.withTimeout(
        imageCacheService.preloadImages(this.preloadConfig.criticalImages, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.8,
          format: 'webp',
        }),
        5000, // 5 segundos máximo
        'Timeout precargando imágenes críticas',
      );

      this.updateProgress(25);
    } catch (error) {
      console.warn('Error o timeout al precargar imágenes críticas:', error);
    }
  }

  /**
   * Precarga tiles de mapa para el área principal
   * Esta función se ejecuta en background y no bloquea la carga inicial
   */
  private async preloadMapTiles(): Promise<void> {
    try {
      // Verificar conexión antes de precargar tiles
      if (!this.isOnline()) {
        console.log('Sin conexión, omitiendo precarga de tiles');
        return;
      }

      const { center, zoom, radius } = this.preloadConfig.mapTiles;

      // Precargar tiles para diferentes niveles de zoom con timeout total
      const zoomLevels = [zoom - 1, zoom, zoom + 1];

      // Limitar tiempo total de precarga de tiles a 10 segundos
      const preloadPromise = (async () => {
        for (const z of zoomLevels) {
          if (z >= 5 && z <= 19) {
            try {
              await mapTileCacheService.preloadTiles(center, z, radius);
            } catch (error) {
              console.warn(`Error precargando tiles en zoom ${z}:`, error);
              // Continuar con el siguiente nivel de zoom
            }
          }
        }
      })();

      await this.withTimeout(
        preloadPromise,
        10000, // 10 segundos máximo para todos los tiles
        'Timeout precargando tiles de mapa',
      );

      this.updateProgress(50);
    } catch (error) {
      console.warn('Error o timeout al precargar tiles de mapa:', error);
      // No es crítico, el mapa puede cargar tiles bajo demanda
    }
  }

  /**
   * Precarga fuentes críticas
   */
  private async preloadFonts(): Promise<void> {
    if (this.preloadConfig.fonts.length === 0) {
      return;
    }

    try {
      const fontPromises = this.preloadConfig.fonts.map((fontUrl) =>
        this.preloadFont(fontUrl),
      );

      await Promise.allSettled(fontPromises);
      this.updateProgress(75);
    } catch (error) {
      console.error('Error al precargar fuentes:', error);
    }
  }

  /**
   * Precarga una fuente específica
   */
  private async preloadFont(fontUrl: string): Promise<void> {
    try {
      const fetchPromise = fetch(fontUrl);
      const response = await this.withTimeout(
        fetchPromise,
        3000, // 3 segundos máximo por fuente
        `Timeout precargando fuente ${fontUrl}`,
      );

      if (response.ok) {
        const fontBlob = await response.blob();
        const fontFace = new FontFace(
          'preloaded-font',
          await fontBlob.arrayBuffer(),
        );
        await fontFace.load();
        document.fonts.add(fontFace);
      }
    } catch (error) {
      console.warn(`Error o timeout al precargar fuente ${fontUrl}:`, error);
    }
  }

  /**
   * Precarga iconos críticos
   */
  private async preloadIcons(): Promise<void> {
    if (this.preloadConfig.icons.length === 0) {
      return;
    }

    try {
      await imageCacheService.preloadImages(this.preloadConfig.icons, {
        maxWidth: 64,
        maxHeight: 64,
        quality: 0.9,
        format: 'webp',
      });

      this.updateProgress(100);
    } catch (error) {
      console.error('Error al precargar iconos:', error);
    }
  }

  /**
   * Actualiza el progreso de precarga
   */
  private updateProgress(progress: number): void {
    this.preloadProgress = progress;

    // Emitir evento de progreso si hay listeners
    if (globalThis.window !== undefined) {
      globalThis.window.dispatchEvent(
        new CustomEvent('preload-progress', {
          detail: { progress },
        }),
      );
    }
  }

  /**
   * Obtiene el progreso actual de precarga
   */
  getProgress(): number {
    return this.preloadProgress;
  }

  /**
   * Verifica si está precargando
   */
  isPreloadingAssets(): boolean {
    return this.isPreloading;
  }

  /**
   * Actualiza la configuración de precarga
   */
  updateConfig(newConfig: Partial<PreloadConfig>): void {
    this.preloadConfig = {
      ...this.preloadConfig,
      ...newConfig,
    };
  }

  /**
   * Obtiene estadísticas de precarga
   */
  async getPreloadStats(): Promise<{
    imageStats: {
      memoryCacheSize: number;
      diskCacheSize: number;
      diskCacheItems: number;
    };
    tileStats: {
      totalTiles: number;
      totalSize: number;
      averageTileSize: number;
    };
    isPreloading: boolean;
    progress: number;
  }> {
    const [imageStats, tileStats] = await Promise.all([
      imageCacheService.getImageCacheStats(),
      mapTileCacheService.getTileCacheStats(),
    ]);

    return {
      imageStats,
      tileStats,
      isPreloading: this.isPreloading,
      progress: this.preloadProgress,
    };
  }
}

// Configuración por defecto para la aplicación Rout2Me
const defaultPreloadConfig: PreloadConfig = {
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
};

// Instancia singleton
export const assetPreloader = AssetPreloader.getInstance(defaultPreloadConfig);
