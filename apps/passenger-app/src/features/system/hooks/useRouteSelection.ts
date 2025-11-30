import { useCallback } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import type { SearchItem } from '../../../shared/types/search';
import { recentSearchesStorage } from '../../routes/services/recentSearchService';
import { recentRoutesStorage } from '../../routes/services/routeService';
import { createStopMarkerElement } from '../../routes/utils/markerUtils';
import { processRouteWithCoordinates } from '../../routes/services/mapMatchingService';
import { mapTileCacheService } from '../../routes/services/mapTileCacheService';
import {
  getStadiaApiKey,
  isMapMatchingAvailable,
} from '../../../config/config';
import { getRouteColor } from '../../../utils/routeUtils';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import type { Stop } from '../../routes/services/routeService';
import type { RouteDrawingOptions } from '../../routes/hooks/useRouteDrawing';
import type { Marker } from 'maplibre-gl';

export interface UseRouteSelectionOptions {
  mapInstance: React.RefObject<MlMap | null>;
  addRouteToMap: (
    routeId: string,
    coordinates: [number, number][],
    options?: RouteDrawingOptions,
    stops?: Stop[],
  ) => Promise<void>;
  clearAllRoutes: () => Promise<void>;
  clearAllBuses: () => Promise<void>;
  fitBoundsToRoute: (
    coordinates: [number, number][],
    hasInfoCard?: boolean,
  ) => void;
  highlightRoute: (routeId: string, highlight: boolean) => void;
  loadBusesForRoute: (
    routeVariantId: string,
    highlightedBusId?: string,
  ) => Promise<void>;
  getRouteIdForStop: (stopId: string) => string | null;
  setIsMapLoading: (loading: boolean) => void;
  setSelectedItem: (item: SearchItem | null) => void;
  setSelectedMarker: (marker: Marker | null) => void;
  selectedItem: SearchItem | null;
  currentMarker: React.MutableRefObject<maplibregl.Marker | null>;
}

/**
 * Hook para manejar la selección de rutas y paradas
 */
export function useRouteSelection({
  mapInstance,
  addRouteToMap,
  clearAllRoutes,
  clearAllBuses,
  fitBoundsToRoute,
  highlightRoute,
  loadBusesForRoute,
  getRouteIdForStop,
  setIsMapLoading,
  setSelectedItem,
  setSelectedMarker,
  selectedItem,
  currentMarker,
}: UseRouteSelectionOptions) {
  // Función interna sin debounce para la lógica real
  const handleItemSelectInternal = useCallback(
    async (item: SearchItem) => {
      if (!mapInstance.current) return;

      if (item.type === 'stop' && 'lat' in item && 'lng' in item) {
        recentSearchesStorage.saveRecentSearch({
          id: item.id,
          type: 'stop',
        });

        // Verificar si la parada pertenece a una ruta actualmente graficada
        const routeIdForStop = getRouteIdForStop(item.id);
        const stopBelongsToCurrentRoute =
          routeIdForStop !== null &&
          selectedItem?.type === 'route' &&
          selectedItem?.id === routeIdForStop;

        // Si la parada pertenece a la ruta actual, NO limpiar rutas ni marcadores
        if (!stopBelongsToCurrentRoute) {
          await clearAllRoutes();
          await clearAllBuses();
        } else {
          await clearAllBuses();
        }

        if (currentMarker.current) {
          currentMarker.current.remove();
        }

        mapInstance.current.flyTo({
          center: [item.lng, item.lat],
          zoom: 17,
          duration: 1000,
        });

        if (!stopBelongsToCurrentRoute) {
          const markerElement = createStopMarkerElement({
            highlight: true,
            opacity: 0,
          });

          currentMarker.current = new maplibregl.Marker({
            element: markerElement,
            anchor: 'center',
          })
            .setLngLat([item.lng, item.lat])
            .addTo(mapInstance.current);

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (currentMarker.current) {
                const element = currentMarker.current.getElement();
                if (element) {
                  element.style.transition = 'opacity 300ms ease-in-out';
                  element.style.opacity = '1';
                }
              }
            });
          });
        }

        setSelectedItem(item);
      } else if (
        item.type === 'route' &&
        'coordinates' in item &&
        item.coordinates
      ) {
        const routeLayerId = `route-main-${item.id}`;
        const routeExistsInMap =
          mapInstance.current?.getLayer(routeLayerId) !== undefined;

        recentRoutesStorage.saveRecentRoute(item.id);
        recentSearchesStorage.saveRecentSearch({
          id: item.id,
          type: 'route',
        });

        if (routeExistsInMap) {
          setSelectedItem(item);
          setSelectedMarker(null);
          highlightRoute(item.id, true);
          return;
        }

        if (currentMarker.current) {
          currentMarker.current.remove();
          currentMarker.current = null;
        }

        await clearAllRoutes();
        await clearAllBuses();

        setIsMapLoading(true);

        try {
          const apiKey = getStadiaApiKey();
          const shouldApplyMapMatching = isMapMatchingAvailable();

          const processedRoute = await processRouteWithCoordinates(
            item.coordinates,
            apiKey,
            shouldApplyMapMatching,
          );

          await addRouteToMap(
            item.id,
            processedRoute.matchedGeometry.coordinates as [number, number][],
            {
              color: getRouteColor('--color-route-default', '#1E56A0'),
              width: 4,
              opacity: 0.9,
              outlineColor: getRouteColor('--color-route-outline', '#ffffff'),
              outlineWidth: 8,
            },
            item.routeStops?.map((stop) => ({
              id: stop.id,
              name: stop.name,
              created_at: new Date().toISOString(),
              location: stop.location,
            })),
          );

          fitBoundsToRoute(
            processedRoute.matchedGeometry.coordinates as [number, number][],
            true,
          );

          highlightRoute(item.id, true);
          await loadBusesForRoute(item.id);

          setTimeout(() => {
            if (mapInstance.current) {
              const center = mapInstance.current.getCenter();
              const zoom = mapInstance.current.getZoom();
              mapTileCacheService
                .preloadTiles([center.lng, center.lat], zoom, 2)
                .catch(() => {
                  // Error silencioso
                });
            }
          }, 2000);

          setSelectedItem(item);
          setSelectedMarker(null);
        } catch {
          await addRouteToMap(item.id, item.coordinates, {
            color: getRouteColor('--color-route-default', '#1E56A0'),
            width: 4,
            opacity: 0.9,
            outlineColor: getRouteColor('--color-route-outline', '#ffffff'),
            outlineWidth: 8,
            stopColor: getRouteColor('--color-route-stop', '#FF6B35'),
            endpointColor: getRouteColor('--color-route-endpoint', '#1E56A0'),
          });
          fitBoundsToRoute(item.coordinates, true);
          highlightRoute(item.id, true);
          await loadBusesForRoute(item.id);

          setTimeout(() => {
            if (mapInstance.current) {
              const center = mapInstance.current.getCenter();
              const zoom = mapInstance.current.getZoom();
              mapTileCacheService
                .preloadTiles([center.lng, center.lat], zoom, 2)
                .catch(() => {
                  // Error silencioso
                });
            }
          }, 2000);

          setSelectedItem(item);
          setSelectedMarker(null);
        } finally {
          setIsMapLoading(false);
        }
      }
    },
    [
      mapInstance,
      addRouteToMap,
      clearAllRoutes,
      clearAllBuses,
      fitBoundsToRoute,
      highlightRoute,
      loadBusesForRoute,
      getRouteIdForStop,
      selectedItem,
      setIsMapLoading,
      setSelectedItem,
      setSelectedMarker,
      currentMarker,
    ],
  );

  // Debounce para evitar múltiples selecciones rápidas
  const handleItemSelect = useDebounce(handleItemSelectInternal, 100);

  return { handleItemSelect };
}
