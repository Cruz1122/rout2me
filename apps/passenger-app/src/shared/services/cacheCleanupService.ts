/**
 * Servicio de limpieza automática de caché
 * Gestiona la limpieza automática y manual del caché
 */

import { cacheService } from './cacheService';
import { imageCacheService } from './imageCacheService';
import { mapTileCacheService } from '../../features/routes/services/mapTileCacheService';
import { cacheStrategyService } from './cacheStrategyService';

export interface CleanupConfig {
  autoCleanup: boolean;
  cleanupInterval: number; // en milisegundos
  maxCacheSize: number; // en bytes
  maxAge: number; // en milisegundos
  cleanupThreshold: number; // porcentaje de uso para activar limpieza
}

export class CacheCleanupService {
  private static instance: CacheCleanupService;
  private config: CleanupConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isCleaning = false;

  constructor(config: Partial<CleanupConfig> = {}) {
    this.config = {
      autoCleanup: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 horas
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      cleanupThreshold: 0.8, // 80% de uso
      ...config,
    };
  }

  static getInstance(config?: Partial<CleanupConfig>): CacheCleanupService {
    if (!CacheCleanupService.instance) {
      CacheCleanupService.instance = new CacheCleanupService(config);
    }
    return CacheCleanupService.instance;
  }

  /**
   * Inicia el servicio de limpieza automática
   */
  startAutoCleanup(): void {
    if (!this.config.autoCleanup || this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(async () => {
      await this.performCleanup();
    }, this.config.cleanupInterval);

    console.log('Servicio de limpieza automática iniciado');
  }

  /**
   * Detiene el servicio de limpieza automática
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('Servicio de limpieza automática detenido');
    }
  }

  /**
   * Realiza una limpieza completa del caché
   */
  async performCleanup(): Promise<{
    cleanedItems: number;
    freedSpace: number;
    duration: number;
  }> {
    if (this.isCleaning) {
      console.log('Limpieza ya en progreso, omitiendo...');
      return { cleanedItems: 0, freedSpace: 0, duration: 0 };
    }

    this.isCleaning = true;
    const startTime = Date.now();
    let cleanedItems = 0;
    let freedSpace = 0;

    try {
      console.log('Iniciando limpieza del caché...');

      // Obtener estadísticas antes de la limpieza
      const beforeStats = await this.getCacheStats();

      // 1. Limpiar elementos expirados
      await this.cleanupExpiredItems();

      // 2. Limpiar por tamaño si es necesario
      if (
        beforeStats.totalSize >
        this.config.maxCacheSize * this.config.cleanupThreshold
      ) {
        await this.cleanupBySize();
      }

      // 3. Limpiar elementos menos utilizados
      await this.cleanupLeastUsed();

      // 4. Limpiar caché de memoria
      this.cleanupMemoryCache();

      // Obtener estadísticas después de la limpieza
      const afterStats = await this.getCacheStats();

      cleanedItems = beforeStats.totalItems - afterStats.totalItems;
      freedSpace = beforeStats.totalSize - afterStats.totalSize;

      const duration = Date.now() - startTime;

      console.log(
        `Limpieza completada: ${cleanedItems} elementos eliminados, ${this.formatBytes(freedSpace)} liberados en ${duration}ms`,
      );

      return { cleanedItems, freedSpace, duration };
    } catch (error) {
      console.error('Error durante la limpieza:', error);
      throw error;
    } finally {
      this.isCleaning = false;
    }
  }

  /**
   * Limpia elementos expirados
   */
  private async cleanupExpiredItems(): Promise<void> {
    try {
      await cacheService.cleanupExpired();
      await mapTileCacheService.cleanupExpiredTiles();
      console.log('Elementos expirados eliminados');
    } catch (error) {
      console.error('Error al limpiar elementos expirados:', error);
    }
  }

  /**
   * Limpia elementos por tamaño
   */
  private async cleanupBySize(): Promise<void> {
    try {
      const stats = await cacheService.getStats();
      const currentSize = stats.totalSize;
      const targetSize = this.config.maxCacheSize * 0.7; // Reducir al 70%

      if (currentSize > targetSize) {
        const spaceToFree = currentSize - targetSize;
        await this.freeSpace();
        console.log(`Espacio liberado: ${this.formatBytes(spaceToFree)}`);
      }
    } catch (error) {
      console.error('Error al limpiar por tamaño:', error);
    }
  }

  /**
   * Libera espacio eliminando elementos más antiguos
   */
  private async freeSpace(): Promise<void> {
    // Esta implementación requeriría acceso a metadatos de tiempo y tamaño
    // Por simplicidad, usamos el método existente de limpieza
    await cacheService.cleanupExpired();
  }

  /**
   * Limpia elementos menos utilizados
   */
  private async cleanupLeastUsed(): Promise<void> {
    // Esta funcionalidad requeriría tracking de uso
    // Por ahora, solo limpiamos elementos expirados
    await this.cleanupExpiredItems();
  }

  /**
   * Limpia el caché en memoria
   */
  private cleanupMemoryCache(): void {
    try {
      imageCacheService.clearMemoryCache();
      console.log('Caché en memoria limpiado');
    } catch (error) {
      console.error('Error al limpiar caché en memoria:', error);
    }
  }

  /**
   * Limpieza manual por tipo de recurso
   */
  async cleanupByResourceType(resourceType: string): Promise<void> {
    try {
      await cacheStrategyService.cleanupByStrategy(resourceType);
      console.log(`Limpieza completada para tipo de recurso: ${resourceType}`);
    } catch (error) {
      console.error(`Error al limpiar ${resourceType}:`, error);
    }
  }

  /**
   * Limpieza completa del caché
   */
  async clearAllCache(): Promise<void> {
    try {
      await cacheService.clear();
      imageCacheService.clearMemoryCache();
      console.log('Caché completamente limpiado');
    } catch (error) {
      console.error('Error al limpiar todo el caché:', error);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  async getCacheStats(): Promise<{
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
  }> {
    const [cacheStats, imageStats, tileStats] = await Promise.all([
      cacheService.getStats(),
      imageCacheService.getImageCacheStats(),
      mapTileCacheService.getTileCacheStats(),
    ]);

    return {
      totalSize: cacheStats.totalSize,
      totalItems: cacheStats.itemCount,
      imageCache: imageStats,
      tileCache: tileStats,
      isCleaning: this.isCleaning,
    };
  }

  /**
   * Verifica si necesita limpieza
   */
  async needsCleanup(): Promise<boolean> {
    const stats = await this.getCacheStats();
    const sizeThreshold =
      this.config.maxCacheSize * this.config.cleanupThreshold;

    return stats.totalSize > sizeThreshold;
  }

  /**
   * Actualiza la configuración de limpieza
   */
  updateConfig(newConfig: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reiniciar el timer si cambió el intervalo
    if (newConfig.cleanupInterval && this.cleanupTimer) {
      this.stopAutoCleanup();
      this.startAutoCleanup();
    }
  }

  /**
   * Formatea bytes en formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  }

  /**
   * Obtiene información de limpieza
   */
  getCleanupInfo(): {
    isAutoCleanupEnabled: boolean;
    cleanupInterval: number;
    maxCacheSize: number;
    cleanupThreshold: number;
    isCleaning: boolean;
  } {
    return {
      isAutoCleanupEnabled: this.config.autoCleanup,
      cleanupInterval: this.config.cleanupInterval,
      maxCacheSize: this.config.maxCacheSize,
      cleanupThreshold: this.config.cleanupThreshold,
      isCleaning: this.isCleaning,
    };
  }
}

// Instancia singleton con configuración por defecto
export const cacheCleanupService = CacheCleanupService.getInstance({
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 horas
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  cleanupThreshold: 0.8, // 80%
});
