/**
 * Servicio especializado para caché de tiles de mapas
 * Optimizado para MapLibre GL y tiles de CartoDB
 */

import { cacheService } from './cacheService';

export interface TileInfo {
  z: number;
  x: number;
  y: number;
  source: string;
}

export interface MapTileCacheConfig {
  maxZoom: number;
  minZoom: number;
  tileSize: number;
  sources: string[];
}

export class MapTileCacheService {
  private static instance: MapTileCacheService;
  private readonly config: MapTileCacheConfig;

  constructor(config: Partial<MapTileCacheConfig> = {}) {
    this.config = {
      maxZoom: 19,
      minZoom: 5,
      tileSize: 256,
      sources: [
        'https://a.basemaps.cartocdn.com/light_all',
        'https://b.basemaps.cartocdn.com/light_all',
        'https://c.basemaps.cartocdn.com/light_all',
      ],
      ...config,
    };
  }

  static getInstance(
    config?: Partial<MapTileCacheConfig>,
  ): MapTileCacheService {
    if (!MapTileCacheService.instance) {
      MapTileCacheService.instance = new MapTileCacheService(config);
    }
    return MapTileCacheService.instance;
  }

  /**
   * Obtiene un tile con caché
   */
  async getTile(tileInfo: TileInfo): Promise<string> {
    const cacheKey = this.generateTileCacheKey(tileInfo);

    try {
      // Intentar obtener del caché
      const cachedBlob = await cacheService.get(cacheKey);

      if (cachedBlob) {
        return URL.createObjectURL(cachedBlob);
      }

      // Si no está en caché, cargar desde la red
      const tileUrl = this.buildTileUrl(tileInfo);
      const response = await fetch(tileUrl);

      if (!response.ok) {
        throw new Error(`Error al cargar tile: ${response.status}`);
      }

      const blob = await response.blob();

      // Guardar en caché
      await cacheService.set(cacheKey, blob, 'tile');

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error al cargar tile:', error);
      throw error;
    }
  }

  /**
   * Precarga tiles para un área específica
   */
  async preloadTiles(
    center: [number, number],
    zoom: number,
    radius: number = 1,
  ): Promise<void> {
    const tiles = this.getTilesInBounds(center, zoom, radius);
    const loadPromises = tiles.map((tileInfo) =>
      this.getTile(tileInfo).catch((error) => {
        console.warn(
          `Error al precargar tile ${tileInfo.x},${tileInfo.y},${tileInfo.z}:`,
          error,
        );
        return null;
      }),
    );

    await Promise.all(loadPromises);
  }

  /**
   * Obtiene tiles para un área específica
   */
  private getTilesInBounds(
    center: [number, number],
    zoom: number,
    radius: number,
  ): TileInfo[] {
    const tiles: TileInfo[] = [];
    const [lng, lat] = center;

    // Convertir coordenadas a tile coordinates
    const tileX = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const tileY = Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom),
    );

    // Obtener tiles en el radio especificado
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = tileX + dx;
        const y = tileY + dy;

        if (
          x >= 0 &&
          y >= 0 &&
          x < Math.pow(2, zoom) &&
          y < Math.pow(2, zoom)
        ) {
          tiles.push({
            z: zoom,
            x,
            y,
            source: this.getRandomSource(),
          });
        }
      }
    }

    return tiles;
  }

  /**
   * Construye la URL del tile
   */
  private buildTileUrl(tileInfo: TileInfo): string {
    const { z, x, y, source } = tileInfo;
    return `${source}/${z}/${x}/${y}.png`;
  }

  /**
   * Genera una clave de caché para el tile
   */
  private generateTileCacheKey(tileInfo: TileInfo): string {
    const { z, x, y, source } = tileInfo;
    const sourceHash = btoa(source).replaceAll(/[^a-zA-Z0-9]/g, '');
    return `tile_${sourceHash}_${z}_${x}_${y}`;
  }

  /**
   * Obtiene una fuente aleatoria para balancear carga
   */
  private getRandomSource(): string {
    const sources = this.config.sources;
    return sources[Math.floor(Math.random() * sources.length)];
  }

  /**
   * Limpia tiles expirados
   */
  async cleanupExpiredTiles(): Promise<void> {
    await cacheService.cleanupExpired();
  }

  /**
   * Obtiene estadísticas del caché de tiles
   */
  async getTileCacheStats(): Promise<{
    totalTiles: number;
    totalSize: number;
    averageTileSize: number;
  }> {
    const stats = await cacheService.getStats();

    return {
      totalTiles: stats.itemCount,
      totalSize: stats.totalSize,
      averageTileSize:
        stats.itemCount > 0 ? stats.totalSize / stats.itemCount : 0,
    };
  }

  /**
   * Limpia todo el caché de tiles
   */
  async clearTileCache(): Promise<void> {
    await cacheService.clear();
  }
}

// Instancia singleton
export const mapTileCacheService = MapTileCacheService.getInstance();
