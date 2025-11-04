/**
 * Servicio de estrategias de caché
 * Implementa diferentes estrategias de caché según el tipo de recurso
 */

import { cacheService } from './cacheService';

export type CacheStrategy =
  | 'cache-first'
  | 'network-first'
  | 'cache-only'
  | 'network-only'
  | 'stale-while-revalidate';

export interface CacheStrategyConfig {
  strategy: CacheStrategy;
  maxAge?: number;
  staleWhileRevalidate?: boolean;
  fallbackUrl?: string;
}

export class CacheStrategyService {
  private static instance: CacheStrategyService;
  private readonly strategies = new Map<string, CacheStrategyConfig>();

  static getInstance(): CacheStrategyService {
    if (!CacheStrategyService.instance) {
      CacheStrategyService.instance = new CacheStrategyService();
    }
    return CacheStrategyService.instance;
  }

  constructor() {
    this.setupDefaultStrategies();
  }

  /**
   * Configura las estrategias por defecto
   */
  private setupDefaultStrategies(): void {
    // Estrategia para tiles de mapas - Cache First
    this.setStrategy('map-tiles', {
      strategy: 'cache-first',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Estrategia para imágenes - Stale While Revalidate
    this.setStrategy('images', {
      strategy: 'stale-while-revalidate',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      staleWhileRevalidate: true,
    });

    // Estrategia para assets críticos - Cache First
    this.setStrategy('critical-assets', {
      strategy: 'cache-first',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 año
    });

    // Estrategia para datos dinámicos - Network First
    this.setStrategy('dynamic-data', {
      strategy: 'network-first',
      maxAge: 5 * 60 * 1000, // 5 minutos
    });
  }

  /**
   * Establece una estrategia para un tipo de recurso
   */
  setStrategy(resourceType: string, config: CacheStrategyConfig): void {
    this.strategies.set(resourceType, config);
  }

  /**
   * Obtiene la estrategia para un tipo de recurso
   */
  getStrategy(resourceType: string): CacheStrategyConfig {
    return (
      this.strategies.get(resourceType) || {
        strategy: 'cache-first',
        maxAge: 24 * 60 * 60 * 1000, // 1 día por defecto
      }
    );
  }

  /**
   * Ejecuta una estrategia de caché para obtener un recurso
   */
  async executeStrategy<T>(
    resourceType: string,
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      transform?: (data: T) => Blob;
      parse?: (blob: Blob) => Promise<T>;
    } = {},
  ): Promise<T> {
    const strategy = this.getStrategy(resourceType);

    switch (strategy.strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(key, fetchFn, options);

      case 'network-first':
        return this.networkFirstStrategy(key, fetchFn, options);

      case 'cache-only':
        return this.cacheOnlyStrategy(key, options);

      case 'network-only':
        return this.networkOnlyStrategy(fetchFn);

      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(key, fetchFn, options);

      default:
        return this.cacheFirstStrategy(key, fetchFn, options);
    }
  }

  /**
   * Estrategia Cache First: Busca en caché primero, luego en red
   */
  private async cacheFirstStrategy<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      transform?: (data: T) => Blob;
      parse?: (blob: Blob) => Promise<T>;
    },
  ): Promise<T> {
    try {
      // Intentar obtener del caché
      const cachedBlob = await cacheService.get(key);

      if (cachedBlob && options.parse) {
        return await options.parse(cachedBlob);
      }
    } catch (error) {
      console.warn('Error al obtener del caché:', error);
    }

    // Si no está en caché o hay error, obtener de la red
    const data = await fetchFn();

    // Guardar en caché si hay transformación
    if (options.transform) {
      try {
        const blob = options.transform(data);
        await cacheService.set(key, blob, 'data');
      } catch (error) {
        console.warn('Error al guardar en caché:', error);
      }
    }

    return data;
  }

  /**
   * Estrategia Network First: Busca en red primero, luego en caché
   */
  private async networkFirstStrategy<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      transform?: (data: T) => Blob;
      parse?: (blob: Blob) => Promise<T>;
    },
  ): Promise<T> {
    try {
      // Intentar obtener de la red
      const data = await fetchFn();

      // Guardar en caché
      if (options.transform) {
        try {
          const blob = options.transform(data);
          await cacheService.set(key, blob, 'data');
        } catch (error) {
          console.warn('Error al guardar en caché:', error);
        }
      }

      return data;
    } catch (error) {
      console.warn('Error de red, intentando caché:', error);

      // Si falla la red, intentar caché
      const cachedBlob = await cacheService.get(key);
      if (cachedBlob && options.parse) {
        return await options.parse(cachedBlob);
      }

      throw error;
    }
  }

  /**
   * Estrategia Cache Only: Solo busca en caché
   */
  private async cacheOnlyStrategy<T>(
    key: string,
    options: { parse?: (blob: Blob) => Promise<T> },
  ): Promise<T> {
    const cachedBlob = await cacheService.get(key);

    if (!cachedBlob) {
      throw new Error('Recurso no encontrado en caché');
    }

    if (options.parse) {
      return await options.parse(cachedBlob);
    }

    throw new Error('No se puede parsear el recurso del caché');
  }

  /**
   * Estrategia Network Only: Solo busca en red
   */
  private async networkOnlyStrategy<T>(fetchFn: () => Promise<T>): Promise<T> {
    return await fetchFn();
  }

  /**
   * Estrategia Stale While Revalidate: Devuelve caché inmediatamente y actualiza en background
   */
  private async staleWhileRevalidateStrategy<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      transform?: (data: T) => Blob;
      parse?: (blob: Blob) => Promise<T>;
    },
  ): Promise<T> {
    // Obtener del caché inmediatamente si existe
    let cachedData: T | null = null;

    try {
      const cachedBlob = await cacheService.get(key);
      if (cachedBlob && options.parse) {
        cachedData = await options.parse(cachedBlob);
      }
    } catch (error) {
      console.warn('Error al obtener del caché:', error);
    }

    // Actualizar en background
    this.updateInBackground(key, fetchFn, options);

    // Devolver datos del caché si existen, sino esperar la red
    if (cachedData) {
      return cachedData;
    }

    // Si no hay caché, esperar la respuesta de la red
    return await fetchFn();
  }

  /**
   * Actualiza el caché en background
   */
  private async updateInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      transform?: (data: T) => Blob;
      parse?: (blob: Blob) => Promise<T>;
    },
  ): Promise<void> {
    try {
      const data = await fetchFn();

      if (options.transform) {
        const blob = options.transform(data);
        await cacheService.set(key, blob, 'data');
      }
    } catch (error) {
      console.warn('Error al actualizar en background:', error);
    }
  }

  /**
   * Limpia recursos según su estrategia
   */
  async cleanupByStrategy(resourceType: string): Promise<void> {
    const strategy = this.getStrategy(resourceType);

    if (strategy.maxAge) {
      // Implementar limpieza basada en edad
      await this.cleanupByAge();
    }
  }

  /**
   * Limpia recursos por edad
   */
  private async cleanupByAge(): Promise<void> {
    // Esta implementación requeriría acceso a metadatos de tiempo
    // Por simplicidad, usamos el método existente de limpieza
    await cacheService.cleanupExpired();
  }

  /**
   * Obtiene estadísticas por estrategia
   */
  async getStrategyStats(): Promise<{
    strategies: Map<string, CacheStrategyConfig>;
    totalCacheSize: number;
    totalItems: number;
  }> {
    const stats = await cacheService.getStats();

    return {
      strategies: this.strategies,
      totalCacheSize: stats.totalSize,
      totalItems: stats.itemCount,
    };
  }
}

// Instancia singleton
export const cacheStrategyService = CacheStrategyService.getInstance();
