import { useEffect } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import type { SearchItem } from '../../../shared/types/search';
import { processRouteWithCoordinates } from '../../routes/services/mapMatchingService';
import { mapTileCacheService } from '../../routes/services/mapTileCacheService';
import {
  getStadiaApiKey,
  isMapMatchingAvailable,
} from '../../../config/config';
import { getRouteColor } from '../../../utils/routeUtils';

interface RouteFromNavigation {
  id: string;
  code: string;
  name: string;
  path: [number, number][];
  color?: string;
  stops?: Array<{
    id: string;
    name: string;
    location: [number, number];
  }>;
}

interface RouteHandlerProps {
  routeFromNavigation: RouteFromNavigation | null;
  mapInstance: React.RefObject<MlMap | null>;
  addRouteToMap: (
    routeId: string,
    coordinates: [number, number][],
    options?: any,
    stops?: any[],
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
  setIsMapLoading: (loading: boolean) => void;
  setSelectedItem: (item: SearchItem | null) => void;
  setRouteFromNavigation: (route: RouteFromNavigation | null) => void;
  currentMarker: React.MutableRefObject<any>;
}

export function RouteHandler({
  routeFromNavigation,
  mapInstance,
  addRouteToMap,
  clearAllRoutes,
  clearAllBuses,
  fitBoundsToRoute,
  highlightRoute,
  loadBusesForRoute,
  setIsMapLoading,
  setSelectedItem,
  setRouteFromNavigation,
  currentMarker,
}: RouteHandlerProps) {
  useEffect(() => {
    if (!routeFromNavigation || !mapInstance.current) return;

    const processRouteFromNavigation = async () => {
      try {
        const routeLayerId = `route-main-${routeFromNavigation.id}`;
        const routeExistsInMap =
          mapInstance.current?.getLayer(routeLayerId) !== undefined;

        if (routeExistsInMap) {
          const searchItem: SearchItem = {
            id: routeFromNavigation.id,
            type: 'route',
            name: routeFromNavigation.name,
            code: routeFromNavigation.code,
            tags: [],
            coordinates: routeFromNavigation.path,
            color: routeFromNavigation.color || 'var(--color-secondary)',
            routeStops: routeFromNavigation.stops?.map((stop) => ({
              id: stop.id,
              name: stop.name,
              location: stop.location,
            })),
          };
          setSelectedItem(searchItem);
          highlightRoute(routeFromNavigation.id, true);
          return;
        }

        await clearAllRoutes();
        if (currentMarker.current) {
          currentMarker.current.remove();
          currentMarker.current = null;
        }

        setIsMapLoading(true);

        const apiKey = getStadiaApiKey();
        const shouldApplyMapMatching = isMapMatchingAvailable();

        const processedRoute = await processRouteWithCoordinates(
          routeFromNavigation.path,
          apiKey,
          shouldApplyMapMatching,
        );

        const searchItem: SearchItem = {
          id: routeFromNavigation.id,
          type: 'route',
          name: routeFromNavigation.name,
          code: routeFromNavigation.code,
          tags: [],
          coordinates: processedRoute.matchedGeometry.coordinates as [
            number,
            number,
          ][],
          color: routeFromNavigation.color || 'var(--color-secondary)',
          routeStops: routeFromNavigation.stops?.map((stop) => ({
            id: stop.id,
            name: stop.name,
            location: stop.location,
          })),
        };

        await addRouteToMap(
          searchItem.id,
          processedRoute.matchedGeometry.coordinates as [number, number][],
          {
            color: getRouteColor('--color-route-default', '#1E56A0'),
            width: 4,
            opacity: 0.9,
            outlineColor: getRouteColor('--color-route-outline', '#ffffff'),
            outlineWidth: 8,
            stopColor: getRouteColor('--color-route-stop', '#FF6B35'),
            endpointColor: getRouteColor('--color-route-endpoint', '#1E56A0'),
          },
          searchItem.routeStops?.map((stop) => ({
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

        highlightRoute(searchItem.id, true);
        await loadBusesForRoute(searchItem.id);

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

        setSelectedItem(searchItem);
      } catch {
        const searchItem: SearchItem = {
          id: routeFromNavigation.id,
          type: 'route',
          name: routeFromNavigation.name,
          code: routeFromNavigation.code,
          tags: [],
          coordinates: routeFromNavigation.path,
          color: routeFromNavigation.color || 'var(--color-secondary)',
          routeStops: routeFromNavigation.stops?.map((stop) => ({
            id: stop.id,
            name: stop.name,
            location: stop.location,
          })),
        };

        await addRouteToMap(searchItem.id, searchItem.coordinates!, {
          color: getRouteColor('--color-route-default', '#1E56A0'),
          width: 4,
          opacity: 0.9,
          outlineColor: getRouteColor('--color-route-outline', '#ffffff'),
          outlineWidth: 8,
          stopColor: getRouteColor('--color-route-stop', '#FF6B35'),
          endpointColor: getRouteColor('--color-route-endpoint', '#1E56A0'),
        });
        fitBoundsToRoute(searchItem.coordinates!, true);
        highlightRoute(searchItem.id, true);
        await loadBusesForRoute(searchItem.id);
        setSelectedItem(searchItem);
      } finally {
        setIsMapLoading(false);
        setRouteFromNavigation(null);
      }
    };

    processRouteFromNavigation();
  }, [
    routeFromNavigation,
    mapInstance,
    addRouteToMap,
    clearAllRoutes,
    clearAllBuses,
    fitBoundsToRoute,
    highlightRoute,
    loadBusesForRoute,
    setIsMapLoading,
    setSelectedItem,
    setRouteFromNavigation,
    currentMarker,
  ]);

  return null;
}
