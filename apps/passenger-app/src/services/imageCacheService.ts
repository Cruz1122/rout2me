/**
 * Servicio especializado para caché de imágenes y tiles de mapas
 * Optimizado para el rendimiento en conexiones lentas
 */

import { cacheService } from './cacheService';

export interface ImageCacheOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export class ImageCacheService {
  private static instance: ImageCacheService;
  private readonly cache = new Map<string, string>(); // Cache en memoria para URLs de blob
  private readonly loadingPromises = new Map<string, Promise<string>>(); // Evitar cargas duplicadas

  static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  /**
   * Carga una imagen con caché
   */
  async loadImage(
    url: string,
    options: ImageCacheOptions = {},
  ): Promise<string> {
    // Verificar si ya está cargando
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Verificar caché en memoria
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Crear promesa de carga
    const loadPromise = this.loadImageWithCache(url, options);
    this.loadingPromises.set(url, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(url, result);
      return result;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Carga una imagen con estrategia de caché
   */
  private async loadImageWithCache(
    url: string,
    options: ImageCacheOptions,
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(url, options);

    try {
      // Intentar obtener del caché primero
      const cachedBlob = await cacheService.get(cacheKey);

      if (cachedBlob) {
        return URL.createObjectURL(cachedBlob);
      }

      // Si no está en caché, cargar desde la red
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al cargar imagen: ${response.status}`);
      }

      const blob = await response.blob();

      // Optimizar imagen si es necesario
      const optimizedBlob = await this.optimizeImage(blob, options);

      // Guardar en caché
      await cacheService.set(cacheKey, optimizedBlob, 'image');

      return URL.createObjectURL(optimizedBlob);
    } catch (error) {
      console.error('Error al cargar imagen:', error);
      throw error;
    }
  }

  /**
   * Optimiza una imagen según las opciones especificadas
   */
  private async optimizeImage(
    blob: Blob,
    options: ImageCacheOptions,
  ): Promise<Blob> {
    // Si no hay opciones de optimización, devolver el blob original
    if (
      !options.maxWidth &&
      !options.maxHeight &&
      !options.quality &&
      !options.format
    ) {
      return blob;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(blob);
        return;
      }

      img.onload = () => {
        try {
          // Calcular nuevas dimensiones manteniendo la proporción
          let { width, height } = img;

          if (options.maxWidth && width > options.maxWidth) {
            height = (height * options.maxWidth) / width;
            width = options.maxWidth;
          }

          if (options.maxHeight && height > options.maxHeight) {
            width = (width * options.maxHeight) / height;
            height = options.maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob con formato y calidad especificados
          const format = options.format || 'webp';
          const quality = options.quality || 0.8;

          canvas.toBlob(
            (optimizedBlob) => {
              if (optimizedBlob) {
                resolve(optimizedBlob);
              } else {
                resolve(blob);
              }
            },
            `image/${format}`,
            quality,
          );
        } catch (error) {
          console.error('Error al optimizar imagen:', error);
          resolve(blob);
        }
      };

      img.onerror = () => {
        console.error('Error al cargar imagen para optimización');
        resolve(blob);
      };

      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Genera una clave de caché única para la imagen y opciones
   */
  private generateCacheKey(url: string, options: ImageCacheOptions): string {
    const optionsStr = JSON.stringify(options);
    return `img_${btoa(url)}_${btoa(optionsStr)}`;
  }

  /**
   * Precarga una lista de imágenes
   */
  async preloadImages(
    urls: string[],
    options: ImageCacheOptions = {},
  ): Promise<void> {
    const loadPromises = urls.map((url) =>
      this.loadImage(url, options).catch((error) => {
        console.warn(`Error al precargar imagen ${url}:`, error);
        return null;
      }),
    );

    await Promise.all(loadPromises);
  }

  /**
   * Limpia las URLs de blob de la memoria
   */
  revokeObjectURL(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Limpia todas las URLs de blob de la memoria
   */
  clearMemoryCache(): void {
    for (const url of this.cache.values()) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché de imágenes
   */
  async getImageCacheStats(): Promise<{
    memoryCacheSize: number;
    diskCacheSize: number;
    diskCacheItems: number;
  }> {
    const diskStats = await cacheService.getStats();

    return {
      memoryCacheSize: this.cache.size,
      diskCacheSize: diskStats.totalSize,
      diskCacheItems: diskStats.itemCount,
    };
  }
}

// Instancia singleton
export const imageCacheService = ImageCacheService.getInstance();
