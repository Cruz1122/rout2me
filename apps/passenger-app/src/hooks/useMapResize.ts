import { useEffect, useRef } from 'react';
import type { Map as MlMap } from 'maplibre-gl';

/**
 * Hook para manejar el resize del mapa cuando cambia el UI
 * Evita artefactos visuales al abrir/cerrar overlays
 */
export function useMapResize(
  mapInstance: React.RefObject<MlMap | null>,

  dependencies: any[] = [],
) {
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Debounced resize para evitar múltiples llamadas
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
    // Dynamic dependencies array is intentional for this hook
  }, [mapInstance, ...dependencies]);

  return {
    triggerResize: () => {
      if (mapInstance.current) {
        mapInstance.current.resize();
      }
    },
  };
}
