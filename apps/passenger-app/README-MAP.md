# Guía Definitiva: Implementación del Sistema de Mapas

Esta guía proporciona una implementación paso a paso del sistema completo de mapas, incluyendo caché de tiles, map matching, visualización de rutas, paradas y buses en un nuevo frontend.

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Instalación de Dependencias](#instalación-de-dependencias)
4. [Sistema de Caché de Tiles](#sistema-de-caché-de-tiles)
5. [Inicialización del Mapa](#inicialización-del-mapa)
6. [Map Matching con Stadia Maps](#map-matching-con-stadia-maps)
7. [Visualización de Rutas](#visualización-de-rutas)
8. [Obtención de Coordenadas desde Endpoints REST](#obtención-de-coordenadas-desde-endpoints-rest)
9. [Marcadores de Paradas](#marcadores-de-paradas)
10. [Marcadores de Buses](#marcadores-de-buses)
11. [Hooks y Utilidades](#hooks-y-utilidades)
12. [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)

---

## Requisitos Previos

- Node.js 18+ y pnpm (o npm/yarn)
- Proyecto React/TypeScript configurado con Vite
- API Key de Stadia Maps (gratuita): `50519f36-7eba-4cce-8e2d-62189257f2d4`

---

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_STADIA_API_KEY=50519f36-7eba-4cce-8e2d-62189257f2d4
```

### 2. Estructura de Carpetas

```
src/
├── features/
│   └── routes/
│       ├── hooks/
│       │   ├── useRouteDrawing.ts
│       │   └── useBusMapping.ts
│       ├── services/
│       │   ├── mapMatchingService.ts
│       │   └── mapTileCacheService.ts
│       └── utils/
│           └── popupUtils.ts
├── shared/
│   ├── hooks/
│   │   ├── useMapCache.ts
│   │   └── useMapResize.ts
│   └── services/
│       └── cacheService.ts
└── config/
    └── cacheConfig.ts
```

---

## Instalación de Dependencias

```bash
pnpm add maplibre-gl
pnpm add -D @types/maplibre-gl
```

Opcional (para iconos de buses):
```bash
pnpm add react-icons
```

---

## Sistema de Caché de Tiles

### 1. Configuración de Caché (`src/config/cacheConfig.ts`)

```typescript
export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  autoCleanup: boolean;
  cleanupInterval: number;
  cleanupThreshold: number;
  tileCache: {
    maxZoom: number;
    minZoom: number;
    tileSize: number;
    preloadRadius: number;
    sources: string[];
  };
}

export const defaultCacheConfig: CacheConfig = {
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 horas
  cleanupThreshold: 0.8, // 80% de uso
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
};
```

### 2. Servicio de Caché de Tiles (`src/features/routes/services/mapTileCacheService.ts`)

```typescript
import { cacheService } from '../../../shared/services/cacheService';

export interface TileInfo {
  z: number;
  x: number;
  y: number;
  source: string;
}

export class MapTileCacheService {
  private static instance: MapTileCacheService;
  private readonly config: MapTileCacheConfig;

  static getInstance(config?: Partial<MapTileCacheConfig>): MapTileCacheService {
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

    // Precargar tiles en lotes para evitar sobrecarga
    const batchSize = 5;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);
      const loadPromises = batch.map((tileInfo) =>
        this.getTile(tileInfo).catch(() => null),
      );
      await Promise.all(loadPromises);

      if (i + batchSize < tiles.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  }

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

  private buildTileUrl(tileInfo: TileInfo): string {
    const { z, x, y, source } = tileInfo;
    return `${source}/${z}/${x}/${y}.png`;
  }

  private generateTileCacheKey(tileInfo: TileInfo): string {
    const { z, x, y, source } = tileInfo;
    const sourceHash = btoa(source).replaceAll(/[^a-zA-Z0-9]/g, '');
    return `tile_${sourceHash}_${z}_${x}_${y}`;
  }

  private getRandomSource(): string {
    const sources = this.config.sources;
    return sources[Math.floor(Math.random() * sources.length)];
  }
}

export const mapTileCacheService = MapTileCacheService.getInstance();
```

---

## Inicialización del Mapa

### Configuración del Mapa (`src/features/system/pages/HomePage.tsx`)

```typescript
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors © CARTO',
            maxzoom: 19,
            scheme: 'xyz',
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            paint: {
              'raster-fade-duration': 300,
            },
          },
        ],
      },
      center: [-75.5138, 5.0703], // Manizales (ajustar según tu ubicación)
      zoom: 15,
      maxZoom: 19,
      minZoom: 5,
      hash: false,
      trackResize: true,
      fadeDuration: 300,
      crossSourceCollisions: false,
      refreshExpiredTiles: false,
      maxTileCacheSize: 200,
      renderWorldCopies: false,
    });

    map.on('load', () => {
      setIsMapLoading(false);
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {isMapLoading && <div>Cargando mapa...</div>}
    </div>
  );
}
```

---

## Map Matching con Stadia Maps

### Servicio de Map Matching (`src/features/routes/services/mapMatchingService.ts`)

```typescript
export interface MapMatchingResponse {
  matchedGeometry: GeoJSON.LineString;
  confidence: number;
  distance: number; // distancia total en metros
  duration: number; // duración en segundos
}

/**
 * Llama al Map Matching API de Stadia Maps para ajustar una ruta a las calles reales
 */
export async function matchRouteToRoads(
  points: [number, number][],
  apiKey: string,
): Promise<MapMatchingResponse> {
  // Convertir puntos a formato Valhalla
  const shape = points.map(([lon, lat]) => ({
    lat,
    lon,
  }));

  // Configurar parámetros de la solicitud
  const requestBody = {
    shape,
    costing: 'bus', // Usar modo bus para rutas de transporte público
    shape_match: 'map_snap', // Algoritmo de ajuste
    costing_options: {
      bus: {
        use_bus_routes: 1, // Preferir rutas de bus
      },
    },
  };

  const response = await fetch(
    `https://route.stadiamaps.com/trace_route?api_key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Map matching failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  // trace_route devuelve la geometría en data.trip.legs[0].shape
  const matchedShape =
    data.trip?.legs?.[0]?.shape || data.shape || data.matched_points;

  if (!matchedShape) {
    throw new Error('No matched geometry returned from API');
  }

  // Decodificar polyline
  const coordinates = decodePolyline(matchedShape);

  const matchedGeometry: GeoJSON.LineString = {
    type: 'LineString',
    coordinates,
  };

  // Extraer métricas del trip.summary
  const summary = data.trip?.summary || {};
  return {
    matchedGeometry,
    confidence: data.confidence || 1,
    distance: summary.length || 0,
    duration: summary.time || 0,
  };
}

/**
 * Procesa una ruta que ya tiene coordenadas del backend
 * Aplica map matching opcional para refinar la ruta
 */
export async function processRouteWithCoordinates(
  coordinates: [number, number][],
  apiKey?: string,
  applyMapMatching: boolean = false,
): Promise<MapMatchingResponse> {
  // Si no se debe aplicar map matching o no hay API key, devolver las coordenadas originales
  if (!applyMapMatching || !apiKey) {
    return {
      matchedGeometry: {
        type: 'LineString',
        coordinates,
      },
      confidence: 1,
      distance: calculateRouteDistance(coordinates),
      duration: calculateRouteDuration(coordinates),
    };
  }

  // Aplicar map matching para refinar la ruta
  try {
    return await matchRouteToRoads(coordinates, apiKey);
  } catch (error) {
    console.warn('Map matching failed, using original coordinates:', error);
    return {
      matchedGeometry: {
        type: 'LineString',
        coordinates,
      },
      confidence: 0.8,
      distance: calculateRouteDistance(coordinates),
      duration: calculateRouteDuration(coordinates),
    };
  }
}

/**
 * Decodifica un polyline codificado (formato Google/Valhalla) a coordenadas
 */
function decodePolyline(
  encoded: string | ValhallaPoint[] | ValhallaEdge[],
): [number, number][] {
  if (Array.isArray(encoded)) {
    if (encoded.length > 0 && 'shape' in encoded[0]) {
      return processEdges(encoded as ValhallaEdge[]);
    }
    return processPoints(encoded as ValhallaPoint[]);
  }
  return decodePolylineString(encoded);
}

function decodePolylineString(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  const index = { current: 0 };
  let lat = 0;
  let lng = 0;

  while (index.current < encoded.length) {
    const dlat = decodeValue(encoded, index);
    lat += dlat;

    const dlng = decodeValue(encoded, index);
    lng += dlng;

    // Valhalla usa precisión 6 (1e6)
    coordinates.push([lng / 1e6, lat / 1e6]);
  }

  return coordinates;
}

function decodeValue(encoded: string, index: { current: number }): number {
  let b;
  let shift = 0;
  let result = 0;

  do {
    b = (encoded.codePointAt(index.current++) ?? 0) - 63;
    result |= (b & 0x1f) << shift;
    shift += 5;
  } while (b >= 0x20);

  return (result & 1) === 0 ? result >> 1 : ~(result >> 1);
}

function calculateRouteDistance(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    totalDistance += calculateDistanceBetweenPoints(lat1, lng1, lat2, lng2);
  }

  return totalDistance;
}

function calculateRouteDuration(coordinates: [number, number][]): number {
  const distance = calculateRouteDistance(coordinates);
  const averageSpeedKmh = 25; // 25 km/h promedio para transporte público
  const averageSpeedMs = averageSpeedKmh / 3.6;
  return Math.round(distance / averageSpeedMs);
}

function calculateDistanceBetweenPoints(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### Uso del Map Matching

```typescript
import { processRouteWithCoordinates } from './services/mapMatchingService';

// Obtener la API key desde las variables de entorno
const apiKey = import.meta.env.VITE_STADIA_API_KEY;
const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

// Procesar la ruta con coordenadas del backend
const processedRoute = await processRouteWithCoordinates(
  routeCoordinates,
  apiKey,
  shouldApplyMapMatching,
);

// Usar las coordenadas procesadas
const matchedCoordinates = processedRoute.matchedGeometry.coordinates as [
  number,
  number,
][];
```

---

## Visualización de Rutas

### Hook de Dibujo de Rutas (`src/features/routes/hooks/useRouteDrawing.ts`)

```typescript
import { useRef, useCallback } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';

export interface RouteDrawingOptions {
  color?: string;
  width?: number;
  opacity?: number;
  outlineColor?: string;
  outlineWidth?: number;
}

export function useRouteDrawing(mapInstance: React.RefObject<MlMap | null>) {
  const routeSources = useRef<Set<string>>(new Set());
  const routeLayers = useRef<Set<string>>(new Set());

  const addRouteToMap = useCallback(
    (
      routeId: string,
      coordinates: [number, number][],
      options: RouteDrawingOptions = {},
    ) => {
      if (!mapInstance.current || !coordinates || coordinates.length === 0) {
        return;
      }

      const {
        color = '#1E56A0',
        width = 6,
        opacity = 0.9,
        outlineColor = '#ffffff',
        outlineWidth = 8,
      } = options;

      const sourceId = `route-${routeId}`;
      const shadowLayerId = `route-shadow-${routeId}`;
      const outlineLayerId = `route-outline-${routeId}`;
      const mainLayerId = `route-main-${routeId}`;
      const glowLayerId = `route-glow-${routeId}`;

      // Limpiar ruta existente si ya existe
      removeRouteFromMap(routeId);

      // Agregar fuente de datos GeoJSON
      mapInstance.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            routeId,
            color,
            width,
            opacity,
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });

      // Capa de sombra (efecto Google Maps)
      mapInstance.current.addLayer({
        id: shadowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#000000',
          'line-width': outlineWidth + 2,
          'line-opacity': 0.3,
          'line-translate': [2, 2],
        },
      });

      // Capa de contorno
      mapInstance.current.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': outlineColor,
          'line-width': outlineWidth,
          'line-opacity': 1,
        },
      });

      // Capa principal de la ruta
      mapInstance.current.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity,
        },
      });

      // Capa de brillo (efecto Google Maps)
      mapInstance.current.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width + 2,
          'line-opacity': 0.3,
          'line-blur': 3,
        },
      });

      routeSources.current.add(sourceId);
      routeLayers.current.add(shadowLayerId);
      routeLayers.current.add(outlineLayerId);
      routeLayers.current.add(mainLayerId);
      routeLayers.current.add(glowLayerId);
    },
    [mapInstance],
  );

  const removeRouteFromMap = useCallback(
    (routeId: string) => {
      if (!mapInstance.current) return;

      const layersToRemove = [
        `route-shadow-${routeId}`,
        `route-outline-${routeId}`,
        `route-main-${routeId}`,
        `route-glow-${routeId}`,
      ];

      const sourcesToRemove = [`route-${routeId}`];

      // Remover capas
      for (const layerId of layersToRemove) {
        if (mapInstance.current.getLayer(layerId)) {
          mapInstance.current.removeLayer(layerId);
          routeLayers.current.delete(layerId);
        }
      }

      // Remover fuentes
      for (const sourceId of sourcesToRemove) {
        if (mapInstance.current.getSource(sourceId)) {
          mapInstance.current.removeSource(sourceId);
          routeSources.current.delete(sourceId);
        }
      }
    },
    [mapInstance],
  );

  const clearAllRoutes = useCallback(() => {
    if (!mapInstance.current) return;

    const sourcesToRemove = Array.from(routeSources.current);
    const layersToRemove = Array.from(routeLayers.current);

    // Remover todas las capas
    for (const layerId of layersToRemove) {
      if (mapInstance.current.getLayer(layerId)) {
        mapInstance.current.removeLayer(layerId);
      }
    }

    // Remover todas las fuentes
    for (const sourceId of sourcesToRemove) {
      if (mapInstance.current.getSource(sourceId)) {
        mapInstance.current.removeSource(sourceId);
      }
    }

    routeSources.current.clear();
    routeLayers.current.clear();
  }, [mapInstance]);

  const fitBoundsToRoute = useCallback(
    (coordinates: [number, number][]) => {
      if (!mapInstance.current || coordinates.length === 0) return;

      const bounds = new maplibregl.LngLatBounds();
      for (const coord of coordinates) {
        bounds.extend(coord);
      }

      mapInstance.current.fitBounds(bounds, {
        padding: 50,
        duration: 1500,
        maxZoom: 18,
        essential: true,
      });
    },
    [mapInstance],
  );

  return {
    addRouteToMap,
    removeRouteFromMap,
    clearAllRoutes,
    fitBoundsToRoute,
  };
}
```

---

## Obtención de Coordenadas desde Endpoints REST

Esta sección explica cómo obtener y transformar las coordenadas desde los endpoints del backend para graficarlas en el mapa.

### Variables de Entorno Necesarias

```env
VITE_BACKEND_REST_URL=https://tu-backend-url.com
VITE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 1. Endpoint: `v_route_variants_agg` - Obtener Rutas y Coordenadas

Este endpoint devuelve todas las variantes de rutas con sus coordenadas y paradas agregadas.

#### Estructura de la Respuesta

```typescript
interface ApiRouteVariantAggregated {
  route_id: string;
  route_code: string;
  route_name: string;
  route_active: boolean;
  variant_id: string;
  path: { lat: number; lng: number }[];  // Array de coordenadas
  length_m_json: number;
  stops: {
    id: string;
    name: string;
    location: { lat: number; lng: number };
  }[];
}
```

#### Servicio para Obtener Rutas (`src/features/routes/services/routeService.ts`)

```typescript
const API_REST_URL = import.meta.env.VITE_BACKEND_REST_URL;

export interface ApiRouteVariantAggregated {
  route_id: string;
  route_code: string;
  route_name: string;
  route_active: boolean;
  variant_id: string;
  path: { lat: number; lng: number }[];
  length_m_json: number;
  stops: {
    id: string;
    name: string;
    location: { lat: number; lng: number };
  }[];
}

/**
 * Obtiene todas las rutas desde el endpoint agregado
 */
export async function fetchAllRoutesData(): Promise<Route[]> {
  try {
    const response = await fetch(`${API_REST_URL}/v_route_variants_agg`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiVariants: ApiRouteVariantAggregated[] = await response.json();

    // Transformar los datos agregados a rutas
    return transformAggregatedVariantsToRoutes(apiVariants);
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
}

/**
 * Transforma los datos agregados del endpoint a formato de ruta
 * IMPORTANTE: Convierte {lat, lng} a [lng, lat] para MapLibre GL
 */
function transformAggregatedVariantsToRoutes(
  apiVariants: ApiRouteVariantAggregated[],
): Route[] {
  const routes: Route[] = [];

  for (const variant of apiVariants) {
    // ⚠️ CONVERSIÓN CRÍTICA: El backend devuelve {lat, lng}
    // MapLibre GL requiere [lng, lat]
    const path: [number, number][] = variant.path.map((point) => [
      point.lng,  // Longitud primero
      point.lat,  // Latitud segundo
    ]);

    // Convertir paradas al formato esperado
    const stops: Stop[] = variant.stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      created_at: '',
      location: [stop.location.lng, stop.location.lat], // También convertir aquí
    }));

    const route: Route = {
      id: variant.variant_id,
      code: variant.route_code,
      name: variant.route_name,
      active: variant.route_active,
      path: path,  // Coordenadas convertidas a [lng, lat][]
      stops: stops,
      // ... otros campos
    };

    routes.push(route);
  }

  return routes;
}
```

#### Uso: Graficar Rutas desde el Endpoint

```typescript
import { fetchAllRoutesData } from './services/routeService';
import { useRouteDrawing } from './hooks/useRouteDrawing';
import { processRouteWithCoordinates } from './services/mapMatchingService';

function MapComponent() {
  const { addRouteToMap, fitBoundsToRoute } = useRouteDrawing(mapInstance);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        // 1. Obtener rutas desde el endpoint
        const routes = await fetchAllRoutesData();

        // 2. Para cada ruta, aplicar map matching y graficar
        for (const route of routes) {
          if (!route.path || route.path.length === 0) continue;

          // 3. Obtener API key para map matching
          const apiKey = import.meta.env.VITE_STADIA_API_KEY;
          const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

          // 4. Procesar coordenadas con map matching (opcional)
          const processedRoute = await processRouteWithCoordinates(
            route.path,  // Ya está en formato [lng, lat][]
            apiKey,
            shouldApplyMapMatching,
          );

          // 5. Graficar la ruta en el mapa
          addRouteToMap(route.id, processedRoute.matchedGeometry.coordinates as [
            number,
            number,
          ][], {
            color: route.color || '#1E56A0',
            width: 6,
            opacity: 0.9,
            outlineColor: '#ffffff',
            outlineWidth: 8,
          });

          // 6. Ajustar vista para mostrar la ruta (opcional)
          // fitBoundsToRoute(processedRoute.matchedGeometry.coordinates as [number, number][]);
        }
      } catch (error) {
        console.error('Error al cargar rutas:', error);
      }
    };

    loadRoutes();
  }, []);
}
```

#### Filtrar por Ruta Específica

```typescript
/**
 * Obtiene las variantes de una ruta específica
 */
export async function fetchRouteVariants(
  routeId: string,
): Promise<RouteVariant[]> {
  try {
    const response = await fetch(
      `${API_REST_URL}/v_route_variants_agg?route_id=eq.${routeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiVariants: ApiRouteVariantAggregated[] = await response.json();

    // Transformar las variantes agregadas
    return apiVariants.map((variant) => {
      // Convertir path a formato [lng, lat]
      const path: [number, number][] = variant.path.map((point) => [
        point.lng,
        point.lat,
      ]);

      const stops: Stop[] = variant.stops.map((stop) => ({
        id: stop.id,
        name: stop.name,
        created_at: '',
        location: [stop.location.lng, stop.location.lat],
      }));

      return {
        id: variant.variant_id,
        route_id: variant.route_id,
        path,
        length_m: variant.length_m_json,
        stops,
      };
    });
  } catch (error) {
    console.error('Error fetching route variants:', error);
    return [];
  }
}
```

---

### 2. Endpoint: `v_bus_latest_positions` - Obtener Posiciones de Buses

Este endpoint devuelve las últimas posiciones conocidas de todos los buses.

#### Estructura de la Respuesta

```typescript
interface ApiBusLatestPosition {
  bus_id: string;
  plate: string;
  company_id: string;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  active_trip_id: string | null;
  active_route_variant_id: string | null;
  vp_id: string | null;
  vp_at: string | null;
  location_json: { lat: number; lng: number } | null;  // ⚠️ Formato {lat, lng}
  speed_kph: number | null;
  heading: number | null;
}
```

#### Servicio para Obtener Buses (`src/features/routes/services/busService.ts`)

```typescript
const API_REST_URL = import.meta.env.VITE_BACKEND_REST_URL;

export interface ApiBusLatestPosition {
  bus_id: string;
  plate: string;
  company_id: string;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  active_trip_id: string | null;
  active_route_variant_id: string | null;
  vp_id: string | null;
  vp_at: string | null;
  location_json: { lat: number; lng: number } | null;
  speed_kph: number | null;
  heading: number | null;
}

export interface BusLocation {
  latitude: number;
  longitude: number;
}

export interface Bus {
  id: string;
  plate: string;
  routeNumber: string;
  routeName: string;
  status: 'active' | 'nearby' | 'offline';
  location: BusLocation | null;
  speed: number | null;
  heading: number | null;
  activeRouteVariantId: string | null;
}

/**
 * Obtiene todos los buses desde el endpoint
 */
export async function fetchBuses(): Promise<Bus[]> {
  try {
    const response = await fetch(`${API_REST_URL}/v_bus_latest_positions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiBuses: ApiBusLatestPosition[] = await response.json();

    // Transformar los datos de la API al formato esperado por la UI
    const transformedBuses = await Promise.all(
      apiBuses.map(async (apiBus) => {
        return transformApiBusToBus(apiBus);
      }),
    );

    return transformedBuses;
  } catch (error) {
    console.error('Error fetching buses:', error);
    throw error;
  }
}

/**
 * Transforma un bus de la API al formato esperado por la UI
 * ⚠️ CONVERSIÓN: {lat, lng} -> {latitude, longitude}
 */
async function transformApiBusToBus(
  apiBus: ApiBusLatestPosition,
): Promise<Bus> {
  // Mapear el estado de la API al estado de la UI
  const status = mapApiStatusToBusStatus(apiBus.status);

  // Obtener información de la ruta (opcional, desde caché)
  let routeInfo: RouteInfo | null = null;
  if (apiBus.active_route_variant_id) {
    routeInfo = await fetchRouteInfoForVariant(apiBus.active_route_variant_id);
  }

  const routeNumber = routeInfo?.code || 'N/A';
  const routeName = routeInfo?.name || 'Sin ruta asignada';

  // ⚠️ CONVERSIÓN CRÍTICA: Convertir location_json a BusLocation
  let location: BusLocation | null = null;
  if (apiBus.location_json) {
    location = {
      latitude: apiBus.location_json.lat,   // Latitud
      longitude: apiBus.location_json.lng,  // Longitud
    };
  }

  return {
    id: apiBus.bus_id,
    plate: apiBus.plate,
    routeNumber,
    routeName,
    status,
    location,  // Formato {latitude, longitude}
    speed: apiBus.speed_kph,
    heading: apiBus.heading,
    activeRouteVariantId: apiBus.active_route_variant_id,
  };
}

/**
 * Mapea el estado de la API al estado de la UI
 */
function mapApiStatusToBusStatus(
  apiStatus: ApiBusLatestPosition['status'],
): Bus['status'] {
  switch (apiStatus) {
    case 'AVAILABLE':
    case 'IN_SERVICE':
      return 'active';
    case 'OUT_OF_SERVICE':
    case 'MAINTENANCE':
      return 'offline';
    default:
      return 'offline';
  }
}

/**
 * Obtiene los buses que pertenecen a una variante de ruta específica
 */
export function getBusesByRouteVariant(
  buses: Bus[],
  routeVariantId: string,
): Bus[] {
  return buses.filter(
    (bus) =>
      bus.activeRouteVariantId === routeVariantId &&
      bus.status !== 'offline' &&
      bus.location !== null,
  );
}
```

#### Uso: Graficar Buses desde el Endpoint

```typescript
import { fetchBuses, getBusesByRouteVariant } from './services/busService';
import { useBusMapping } from './hooks/useBusMapping';

function MapComponent() {
  const { addBusesToMap, clearAllBuses } = useBusMapping(mapInstance);

  useEffect(() => {
    const loadBuses = async () => {
      try {
        // 1. Obtener todos los buses desde el endpoint
        const buses = await fetchBuses();

        // 2. Filtrar solo buses con ubicación válida
        const busesWithLocation = buses.filter(
          (bus) => bus.location && bus.status !== 'offline',
        );

        // 3. Graficar todos los buses en el mapa
        addBusesToMap(busesWithLocation);

        // O alternativamente, filtrar por ruta específica:
        // const routeVariantId = 'variant-123';
        // const busesForRoute = getBusesByRouteVariant(buses, routeVariantId);
        // addBusesToMap(busesForRoute, highlightedBusId);
      } catch (error) {
        console.error('Error al cargar buses:', error);
      }
    };

    loadBuses();

    // Actualizar buses periódicamente (cada 30 segundos)
    const interval = setInterval(loadBuses, 30000);

    return () => {
      clearInterval(interval);
      clearAllBuses();
    };
  }, []);
}
```

#### Actualización en Tiempo Real

```typescript
import { useEffect, useRef } from 'react';
import { fetchBuses } from './services/busService';
import { useBusMapping } from './hooks/useBusMapping';

function LiveMapComponent() {
  const { addBusesToMap, updateBusOnMap, clearAllBuses } = useBusMapping(mapInstance);
  const busesRef = useRef<Map<string, Bus>>(new Map());

  useEffect(() => {
    const updateBuses = async () => {
      try {
        const buses = await fetchBuses();
        const busesWithLocation = buses.filter(
          (bus) => bus.location && bus.status !== 'offline',
        );

        // Actualizar o agregar buses al mapa
        for (const bus of busesWithLocation) {
          const existingBus = busesRef.current.get(bus.id);
          if (existingBus) {
            // Actualizar posición existente
            updateBusOnMap(bus);
          } else {
            // Agregar nuevo bus
            busesRef.current.set(bus.id, bus);
          }
        }

        // Remover buses que ya no están activos
        const activeBusIds = new Set(busesWithLocation.map((b) => b.id));
        for (const [busId, bus] of busesRef.current) {
          if (!activeBusIds.has(busId)) {
            busesRef.current.delete(busId);
            // Remover del mapa usando el hook
          }
        }

        // Actualizar todos los buses en el mapa
        addBusesToMap(Array.from(busesRef.current.values()));
      } catch (error) {
        console.error('Error al actualizar buses:', error);
      }
    };

    // Cargar inicialmente
    updateBuses();

    // Actualizar cada 30 segundos
    const interval = setInterval(updateBuses, 30000);

    return () => {
      clearInterval(interval);
      clearAllBuses();
    };
  }, []);
}
```

---

### Resumen de Conversiones de Coordenadas

⚠️ **IMPORTANTE**: El backend devuelve coordenadas en formato `{lat, lng}`, pero MapLibre GL requiere `[lng, lat]`.

#### Para Rutas (Path):
```typescript
// Backend devuelve:
path: { lat: 5.0703, lng: -75.5138 }[]

// Convertir a:
path: [-75.5138, 5.0703][]  // [lng, lat][]
```

#### Para Paradas (Stops):
```typescript
// Backend devuelve:
location: { lat: 5.0703, lng: -75.5138 }

// Convertir a:
location: [-75.5138, 5.0703]  // [lng, lat]
```

#### Para Buses:
```typescript
// Backend devuelve:
location_json: { lat: 5.0703, lng: -75.5138 }

// Convertir a:
location: {
  latitude: 5.0703,
  longitude: -75.5138
}

// Para usar en MapLibre GL Marker:
.setLngLat([bus.location.longitude, bus.location.latitude])  // [lng, lat]
```

---

### Ejemplo Completo: Integración de Ambos Endpoints

```typescript
import { useEffect, useRef, useState } from 'react';
import { fetchAllRoutesData } from './services/routeService';
import { fetchBuses } from './services/busService';
import { useRouteDrawing } from './hooks/useRouteDrawing';
import { useBusMapping } from './hooks/useBusMapping';
import { processRouteWithCoordinates } from './services/mapMatchingService';

function CompleteMapComponent() {
  const mapInstance = useRef<MlMap | null>(null);
  const { addRouteToMap, clearAllRoutes } = useRouteDrawing(mapInstance);
  const { addBusesToMap, clearAllBuses } = useBusMapping(mapInstance);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);

        // 1. Cargar rutas desde v_route_variants_agg
        const routes = await fetchAllRoutesData();
        const apiKey = import.meta.env.VITE_STADIA_API_KEY;
        const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

        // Graficar cada ruta
        for (const route of routes) {
          if (!route.path || route.path.length === 0) continue;

          const processedRoute = await processRouteWithCoordinates(
            route.path,  // Ya está en [lng, lat][]
            apiKey,
            shouldApplyMapMatching,
          );

          addRouteToMap(route.id, processedRoute.matchedGeometry.coordinates as [
            number,
            number,
          ][], {
            color: route.color || '#1E56A0',
            width: 6,
            opacity: 0.9,
            outlineColor: '#ffffff',
            outlineWidth: 8,
          });
        }

        // 2. Cargar buses desde v_bus_latest_positions
        const buses = await fetchBuses();
        const busesWithLocation = buses.filter(
          (bus) => bus.location && bus.status !== 'offline',
        );

        addBusesToMap(busesWithLocation);

        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar datos del mapa:', error);
        setIsLoading(false);
      }
    };

    if (mapInstance.current) {
      loadMapData();
    }

    // Actualizar buses cada 30 segundos
    const busInterval = setInterval(async () => {
      try {
        const buses = await fetchBuses();
        const busesWithLocation = buses.filter(
          (bus) => bus.location && bus.status !== 'offline',
        );
        addBusesToMap(busesWithLocation);
      } catch (error) {
        console.error('Error al actualizar buses:', error);
      }
    }, 30000);

    return () => {
      clearInterval(busInterval);
      clearAllRoutes();
      clearAllBuses();
    };
  }, [mapInstance.current]);

  return (
    <div>
      {isLoading && <div>Cargando mapa...</div>}
      {/* Tu componente de mapa aquí */}
    </div>
  );
}
```

---

## Marcadores de Paradas

### Función para Crear Marcadores de Paradas

```typescript
function createStopMarkerElement(): HTMLElement {
  const element = document.createElement('div');
  element.innerHTML = `
    <div style="
      background: #FF6B35;
      border: 3px solid #ffffff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
    " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
      <strong>P</strong>
    </div>
  `;
  return element;
}

// Agregar paradas al mapa
const addStopsToMap = useCallback(
  (routeId: string, stops: Stop[]) => {
    if (!mapInstance.current || !stops || stops.length === 0) return;

    for (const [index, stop] of stops.entries()) {
      const marker = new maplibregl.Marker({
        element: createStopMarkerElement(),
        anchor: 'center',
      })
        .setLngLat(stop.location)
        .addTo(mapInstance.current);

      // Agregar popup con información de la parada
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: true,
      }).setHTML(
        createPopupHTML({
          title: stop.name,
          subtitle: `Parada ${index + 1}`,
          items: [],
        }),
      );

      marker.setPopup(popup);
    }
  },
  [mapInstance],
);
```

---

## Marcadores de Buses

### Hook de Mapeo de Buses (`src/features/routes/hooks/useBusMapping.ts`)

```typescript
import { useRef, useCallback } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import { RiBus2Fill } from 'react-icons/ri';

interface Bus {
  id: string;
  routeNumber: string;
  routeName: string;
  plate: string;
  status: 'active' | 'nearby' | 'offline';
  location?: {
    latitude: number;
    longitude: number;
  };
}

function getStatusColor(status: Bus['status']): string {
  switch (status) {
    case 'active':
      return '#10B981'; // Verde
    case 'nearby':
      return '#F59E0B'; // Amarillo
    case 'offline':
      return '#9CA3AF'; // Gris
    default:
      return '#9CA3AF';
  }
}

function createBusMarkerElement(bus: Bus, isHighlighted = false): HTMLElement {
  const element = document.createElement('div');
  const statusColor = getStatusColor(bus.status);

  const markerContainer = document.createElement('div');
  markerContainer.style.cssText = `
    background: ${statusColor};
    border: ${isHighlighted ? '4px' : '3px'} solid ${isHighlighted ? '#10B981' : '#ffffff'};
    border-radius: 50%;
    width: ${isHighlighted ? '32px' : '28px'};
    height: ${isHighlighted ? '32px' : '28px'};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: ${isHighlighted ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)'};
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  `;

  // Agregar animación pulse si está destacado
  if (isHighlighted) {
    markerContainer.style.animation = 'pulse 2s infinite';
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Crear el ícono de React Icons
  const iconContainer = document.createElement('div');
  const root = createRoot(iconContainer);
  root.render(RiBus2Fill({ size: 16 }));
  markerContainer.appendChild(iconContainer);

  element.appendChild(markerContainer);
  return element;
}

export function useBusMapping(mapInstance: React.RefObject<MlMap | null>) {
  const busMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());

  const addBusToMap = useCallback(
    (bus: Bus, isHighlighted = false) => {
      if (!mapInstance.current || !bus.location) return;

      // Remover marcador existente si ya existe
      removeBusFromMap(bus.id);

      // Crear marcador personalizado
      const marker = new maplibregl.Marker({
        element: createBusMarkerElement(bus, isHighlighted),
        anchor: 'center',
      })
        .setLngLat([bus.location.longitude, bus.location.latitude])
        .addTo(mapInstance.current);

      // Agregar popup con información del bus
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: true,
      }).setHTML(
        createPopupHTML({
          title: `Bus ${bus.routeNumber}`,
          subtitle: bus.routeName,
          items: [
            { label: 'Placa', value: bus.plate },
            {
              label: 'Estado',
              value: getStatusLabel(bus.status),
              color: getStatusColor(bus.status),
            },
          ],
        }),
      );

      marker.setPopup(popup);
      busMarkers.current.set(bus.id, marker);
    },
    [mapInstance],
  );

  const addBusesToMap = useCallback(
    (buses: Bus[], highlightedBusId?: string) => {
      if (!mapInstance.current) return;

      clearAllBuses();

      for (const bus of buses) {
        if (bus.location && bus.status !== 'offline') {
          const isHighlighted = highlightedBusId === bus.id;
          addBusToMap(bus, isHighlighted);
        }
      }
    },
    [mapInstance, addBusToMap],
  );

  const clearAllBuses = useCallback(() => {
    if (!mapInstance.current) return;
    for (const marker of busMarkers.current.values()) {
      marker.remove();
    }
    busMarkers.current.clear();
  }, [mapInstance]);

  return {
    addBusToMap,
    addBusesToMap,
    clearAllBuses,
  };
}
```

---

## Hooks y Utilidades

### Hook de Caché del Mapa (`src/shared/hooks/useMapCache.ts`)

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { mapTileCacheService } from '../../features/routes/services/mapTileCacheService';

export interface MapCacheOptions {
  center: [number, number];
  zoom: number;
  preloadRadius?: number;
  preloadZoomLevels?: number[];
}

export function useMapCache(options: MapCacheOptions) {
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const preloadCurrentArea = useCallback(async () => {
    try {
      const {
        center,
        zoom,
        preloadRadius = 2,
        preloadZoomLevels = [zoom - 1, zoom, zoom + 1],
      } = options;

      for (const z of preloadZoomLevels) {
        if (z >= 5 && z <= 19) {
          await mapTileCacheService.preloadTiles(center, z, preloadRadius);
        }
      }
    } catch (error) {
      console.warn('Error al precargar tiles del mapa:', error);
    }
  }, [options]);

  const preloadOnMove = useCallback(
    (newCenter: [number, number], newZoom: number) => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }

      preloadTimeoutRef.current = setTimeout(async () => {
        try {
          const zoomLevels = [newZoom - 1, newZoom, newZoom + 1];
          for (const zoom of zoomLevels) {
            if (zoom >= 5 && zoom <= 19) {
              await mapTileCacheService.preloadTiles(newCenter, zoom, 2);
            }
          }
        } catch (error) {
          console.warn('Error al precargar tiles en movimiento:', error);
        }
      }, 500);
    },
    [],
  );

  useEffect(() => {
    preloadCurrentArea();
  }, [preloadCurrentArea]);

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
  };
}
```

### Hook de Resize del Mapa (`src/shared/hooks/useMapResize.ts`)

```typescript
import { useEffect, useRef } from 'react';
import type { Map as MlMap } from 'maplibre-gl';

export function useMapResize(
  mapInstance: React.RefObject<MlMap | null>,
  dependencies: any[] = [],
) {
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!mapInstance.current) return;

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.resize();
      }
    }, 150);

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [mapInstance, ...dependencies]);

  return {
    triggerResize: () => {
      if (mapInstance.current) {
        mapInstance.current.resize();
      }
    },
  };
}
```

### Utilidad de Popups (`src/features/routes/utils/popupUtils.ts`)

```typescript
interface PopupItem {
  label: string;
  value: string;
  color?: string;
}

interface PopupProps {
  title: string;
  subtitle?: string;
  items: PopupItem[];
}

export const createPopupHTML = (props: PopupProps): string => {
  const { title, subtitle, items } = props;

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
      <div style="font-weight: 600; color: #1F2937; margin-bottom: ${subtitle ? '4px' : '8px'}; font-size: 16px;">
        ${title}
      </div>
      ${
        subtitle
          ? `
        <div style="font-size: 14px; color: #6B7280; margin-bottom: 8px;">
          ${subtitle}
        </div>
      `
          : ''
      }
      ${items
        .map(
          (item, index) => `
        <div style="font-size: 14px; color: #374151; margin-bottom: ${index < items.length - 1 ? '4px' : '0'};">
          <strong>${item.label}:</strong> 
          <span style="color: ${item.color || 'inherit'}; font-weight: ${item.color ? '600' : 'normal'};">
            ${typeof item.value === 'string' ? item.value : ''}
          </span>
        </div>
      `,
        )
        .join('')}
    </div>
  `;
};
```

---

## Optimizaciones de Rendimiento

### 1. Precarga de Tiles

```typescript
// Precargar tiles cuando el mapa se mueve
map.on('moveend', () => {
  const center = map.getCenter().toArray() as [number, number];
  const zoom = map.getZoom();
  preloadOnMove(center, zoom);
});
```

### 2. Límites de Zoom

```typescript
const map = new maplibregl.Map({
  // ... otras configuraciones
  maxZoom: 19,
  minZoom: 5, // Evitar cargar tiles innecesarios
});
```

### 3. Configuración de Caché

```typescript
const map = new maplibregl.Map({
  // ... otras configuraciones
  maxTileCacheSize: 200, // Aumentar caché para reusar tiles
  refreshExpiredTiles: false, // No refrescar automáticamente
  fadeDuration: 300, // Animación rápida
  crossSourceCollisions: false, // Mejor rendimiento
});
```

### 4. Limpieza de Recursos

```typescript
useEffect(() => {
  return () => {
    // Limpiar todas las rutas
    clearAllRoutes();
    // Limpiar todos los buses
    clearAllBuses();
    // Limpiar marcadores
    if (mapInstance.current) {
      mapInstance.current.remove();
    }
  };
}, []);
```

---

## Ejemplo de Integración Completa

```typescript
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouteDrawing } from './hooks/useRouteDrawing';
import { useBusMapping } from './hooks/useBusMapping';
import { useMapCache } from './hooks/useMapCache';
import { useMapResize } from './hooks/useMapResize';
import { processRouteWithCoordinates } from './services/mapMatchingService';

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Hooks personalizados
  const { addRouteToMap, clearAllRoutes, fitBoundsToRoute } =
    useRouteDrawing(mapInstance);
  const { addBusesToMap, clearAllBuses } = useBusMapping(mapInstance);
  const { preloadOnMove } = useMapCache({
    center: [-75.5138, 5.0703],
    zoom: 15,
  });
  useMapResize(mapInstance);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors © CARTO',
            maxzoom: 19,
            scheme: 'xyz',
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            paint: {
              'raster-fade-duration': 300,
            },
          },
        ],
      },
      center: [-75.5138, 5.0703],
      zoom: 15,
      maxZoom: 19,
      minZoom: 5,
      maxTileCacheSize: 200,
      refreshExpiredTiles: false,
    });

    map.on('load', () => {
      setIsMapLoading(false);
    });

    map.on('moveend', () => {
      const center = map.getCenter().toArray() as [number, number];
      const zoom = map.getZoom();
      preloadOnMove(center, zoom);
    });

    mapInstance.current = map;

    return () => {
      clearAllRoutes();
      clearAllBuses();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Función para cargar una ruta
  const loadRoute = async (routeCoordinates: [number, number][]) => {
    const apiKey = import.meta.env.VITE_STADIA_API_KEY;
    const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

    const processedRoute = await processRouteWithCoordinates(
      routeCoordinates,
      apiKey,
      shouldApplyMapMatching,
    );

    addRouteToMap('route-1', processedRoute.matchedGeometry.coordinates as [
      number,
      number,
    ][], {
      color: '#1E56A0',
      width: 6,
      opacity: 0.9,
      outlineColor: '#ffffff',
      outlineWidth: 8,
    });

    fitBoundsToRoute(processedRoute.matchedGeometry.coordinates as [
      number,
      number,
    ][]);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {isMapLoading && <div>Cargando mapa...</div>}
    </div>
  );
}
```

---

## Resumen de Configuración

### Variables de Entorno
- `VITE_STADIA_API_KEY`: API key de Stadia Maps para map matching

### Tiles
- Fuente: CARTO Light (gratuita, sin API key)
- Múltiples servidores para balanceo de carga (a, b, c)
- Caché automático con servicio dedicado

### Map Matching
- API: Stadia Maps (basado en Valhalla)
- Modo: `bus` (optimizado para transporte público)
- Algoritmo: `map_snap` (ajuste estricto a calles)

### Marcadores
- **Paradas**: Círculo naranja (#FF6B35) con letra "P"
- **Buses**: Círculo con color según estado (verde/amarillo/gris)
- **Inicio/Fin de ruta**: Marcadores azules estándar

### Rutas
- Capas múltiples: sombra, contorno, línea principal, brillo
- Efecto estilo Google Maps
- Soporte para colores personalizados

---

## Troubleshooting

### El mapa no carga
- Verifica que `maplibre-gl.css` esté importado
- Revisa la consola del navegador para errores de CORS
- Asegúrate de que el contenedor tenga dimensiones definidas

### Los tiles no se cargan
- Verifica la conexión a internet
- Revisa si hay bloqueadores de anuncios activos
- Comprueba que las URLs de tiles sean accesibles

### Map matching falla
- Verifica que la API key sea válida
- Revisa que las coordenadas estén en formato `[lng, lat]`
- Consulta la consola para errores específicos de la API

### Rendimiento lento
- Reduce el `preloadRadius` en la configuración
- Limita el número de marcadores visibles simultáneamente
- Usa `fitBoundsToRoute` con `maxZoom` limitado

---

## Recursos Adicionales

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [Stadia Maps API Documentation](https://docs.stadiamaps.com/)
- [CARTO Basemaps](https://carto.com/basemaps/)

---

**Última actualización**: Esta guía está basada en la implementación actual del proyecto Rout2Me.

