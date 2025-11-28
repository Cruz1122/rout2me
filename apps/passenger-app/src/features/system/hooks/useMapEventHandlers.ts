import { useState, useCallback, useEffect, useRef } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import { useThrottle } from '../../../shared/hooks/useThrottle';
import { prefersReducedMotion } from '../../../utils/deviceDetection';

export interface UseMapEventHandlersResult {
  mapBearing: number;
  setMapBearing: (bearing: number) => void;
  setupMapEvents: (map: MlMap) => void;
}

/**
 * Hook para manejar eventos del mapa con throttling optimizado
 */
export function useMapEventHandlers(
  mapInstance: React.RefObject<MlMap | null>,
): UseMapEventHandlersResult {
  const [mapBearing, setMapBearing] = useState(0);
  const lastBearingUpdate = useRef<number>(0);
  const BEARING_UPDATE_THROTTLE = 16; // ~60fps para rotación

  // Throttle para eventos de rotación (más frecuentes, actualizar a ~60fps)
  const handleRotate = useCallback(() => {
    const now = Date.now();
    if (now - lastBearingUpdate.current >= BEARING_UPDATE_THROTTLE) {
      if (mapInstance.current) {
        setMapBearing(mapInstance.current.getBearing());
        lastBearingUpdate.current = now;
      }
    }
  }, [mapInstance]);

  // Throttle para eventos moveend y zoomend (menos frecuentes pero más costosos)
  const throttledMoveEnd = useThrottle(() => {
    // Aquí se pueden agregar acciones después de mover el mapa
    // Por ejemplo, precargar tiles, actualizar marcadores visibles, etc.
  }, 500);

  const throttledZoomEnd = useThrottle(() => {
    // Acciones después de hacer zoom
  }, 500);

  const setupMapEvents = useCallback(
    (map: MlMap) => {
      // Evento de rotación con throttle ligero
      map.on('rotate', handleRotate);

      // Eventos de movimiento y zoom con throttle más agresivo
      map.on('moveend', throttledMoveEnd);
      map.on('zoomend', throttledZoomEnd);
    },
    [handleRotate, throttledMoveEnd, throttledZoomEnd],
  );

  // Configurar eventos cuando el mapa esté listo
  useEffect(() => {
    if (mapInstance.current) {
      setupMapEvents(mapInstance.current);

      // Aplicar prefers-reduced-motion si está habilitado
      if (prefersReducedMotion()) {
        const map = mapInstance.current;
        // Reducir duraciones de animación
        map.setMinZoom(5);
        // Deshabilitar algunas animaciones costosas
        if (map.getStyle()) {
          const style = map.getStyle();
          if (style.layers) {
            style.layers.forEach((layer) => {
              if (layer.type === 'raster') {
                map.setPaintProperty(layer.id, 'raster-fade-duration', 0);
              }
            });
          }
        }
      }
    }
  }, [mapInstance, setupMapEvents]);

  return {
    mapBearing,
    setMapBearing,
    setupMapEvents,
  };
}
