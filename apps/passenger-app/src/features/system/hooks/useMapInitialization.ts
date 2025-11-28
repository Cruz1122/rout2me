import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import { useTheme } from '../../../contexts/ThemeContext';
import { isMobileDevice } from '../../../utils/deviceDetection';

export interface UseMapInitializationResult {
  mapInstance: React.RefObject<MlMap | null>;
  isMapLoading: boolean;
  isMapReady: boolean;
  isOnline: boolean;
  setIsMapLoading: (loading: boolean) => void;
  setIsOnline: (online: boolean) => void;
}

export function useMapInitialization(
  mapRef: React.RefObject<HTMLDivElement | null>,
): UseMapInitializationResult {
  const { theme } = useTheme();
  const mapInstance = useRef<MlMap | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  // Detectar si es móvil para optimizar tiles
  const isMobile = isMobileDevice();
  const devicePixelRatio =
    typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const useHighResTiles = !isMobile || devicePixelRatio > 1.5;
  const tileSuffix = useHighResTiles ? '@2x' : '';
  const tileSize = useHighResTiles ? 512 : 256;

  // Inicialización del mapa - optimizado para carga rápida
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      // Tiles de CARTO optimizados para móvil
      style: {
        version: 8,
        sources: {
          'carto-tiles': {
            type: 'raster',
            tiles:
              theme === 'dark'
                ? [
                    `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}${tileSuffix}.png`,
                    `https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}${tileSuffix}.png`,
                    `https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}${tileSuffix}.png`,
                    `https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}${tileSuffix}.png`,
                  ]
                : [
                    `https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}${tileSuffix}.png`,
                    `https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}${tileSuffix}.png`,
                    `https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}${tileSuffix}.png`,
                    `https://d.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}${tileSuffix}.png`,
                  ],
            tileSize,
            attribution: '© OpenStreetMap contributors © CARTO',
            maxzoom: 19,
            scheme: 'xyz',
          },
        },
        layers: [
          {
            id: 'carto-tiles-layer',
            type: 'raster',
            source: 'carto-tiles',
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
      hash: false,
      trackResize: true,
      fadeDuration: 300,
      crossSourceCollisions: false,
      refreshExpiredTiles: false,
      // Reducir caché en móvil para ahorrar memoria
      maxTileCacheSize: isMobile ? 150 : 200,
      renderWorldCopies: false,
    });

    // Manejar errores de carga de tiles (no críticos)
    map.on('error', (e) => {
      console.warn('Error en mapa (no crítico):', e.error);
      setIsMapLoading(false);
    });

    // Detectar cuando faltan tiles (posible falta de conexión)
    map.on('error', () => {
      if (!navigator.onLine) {
        setIsOnline(false);
      }
    });

    map.on('load', () => {
      setIsMapLoading(false);
      setIsMapReady(true);
      setIsOnline(navigator.onLine);

      // Mover geolocalización a DESPUÉS de render (no bloqueante)
      setTimeout(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              if (mapInstance.current) {
                mapInstance.current.flyTo({
                  center: [longitude, latitude],
                  zoom: 15,
                  duration: 1500,
                });
              }
            },
            () => {
              // Si falla, mantener ubicación por defecto (Manizales)
            },
            {
              enableHighAccuracy: false,
              timeout: 3000,
              maximumAge: 30000,
            },
          );
        }
      }, 100);
    });

    map.on('idle', () => {
      setIsMapLoading(false);
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapRef, theme, isMobile, tileSuffix, tileSize]);

  // Detectar cambios en el estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (mapInstance.current) {
        const style = mapInstance.current.getStyle();
        if (style?.sources) {
          Object.keys(style.sources).forEach((sourceId) => {
            const source = mapInstance.current?.getSource(sourceId);
            if (
              source &&
              'reload' in source &&
              typeof source.reload === 'function'
            ) {
              (source as { reload: () => void }).reload();
            }
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.warn('Conexión perdida, funcionando en modo offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    mapInstance,
    isMapLoading,
    isMapReady,
    isOnline,
    setIsMapLoading,
    setIsOnline,
  };
}
