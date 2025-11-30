import { useEffect } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import type { SearchItem } from '../../../shared/types/search';
import {
  fetchAllRoutesData,
  generateRouteColor,
  type Stop,
} from '../../routes/services/routeService';
import { processRouteWithCoordinates } from '../../routes/services/mapMatchingService';
import {
  getStadiaApiKey,
  isMapMatchingAvailable,
} from '../../../config/config';
import { getRouteColor } from '../../../utils/routeUtils';
import type { RouteDrawingOptions } from '../../routes/hooks/useRouteDrawing';
import type { Marker } from 'maplibre-gl';

interface BusFromNavigation {
  id: string;
  code: string;
  name: string;
  busId: string;
  busLocation: { latitude: number; longitude: number } | null;
}

interface BusHandlerProps {
  busFromNavigation: BusFromNavigation | null;
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
  loadBusesForRoute: (
    routeVariantId: string,
    highlightedBusId?: string,
  ) => Promise<void>;
  setSelectedItem: (item: SearchItem | null) => void;
  setBusFromNavigation: (bus: BusFromNavigation | null) => void;
  currentMarker: React.MutableRefObject<Marker | null>;
}

export function BusHandler({
  busFromNavigation,
  mapInstance,
  addRouteToMap,
  clearAllRoutes,
  clearAllBuses,
  fitBoundsToRoute,
  loadBusesForRoute,
  setSelectedItem,
  setBusFromNavigation,
  currentMarker,
}: BusHandlerProps) {
  useEffect(() => {
    if (!busFromNavigation || !mapInstance.current) return;

    const processBusFromNavigation = async () => {
      try {
        console.log(
          '[BusHandler] Procesando bus desde navegación:',
          busFromNavigation,
        );
        let routeVariantId = busFromNavigation.id;
        let routeExistsInMap = false;

        try {
          const routes = await fetchAllRoutesData();
          console.log('[BusHandler] Rutas cargadas:', routes.length);

          let route = routes.find((r) => r.id === busFromNavigation.id);
          console.log(
            '[BusHandler] Buscando ruta por ID:',
            busFromNavigation.id,
            route ? 'encontrada' : 'no encontrada',
          );

          if (!route) {
            route = routes.find((r) => r.code === busFromNavigation.code);
            console.log(
              '[BusHandler] Buscando ruta por código:',
              busFromNavigation.code,
              route ? 'encontrada' : 'no encontrada',
            );
          }

          if (!route) {
            const routesWithSameCode = routes.filter(
              (r) => r.code === busFromNavigation.code,
            );
            if (routesWithSameCode.length > 0) {
              route = routesWithSameCode[0];
              console.log(
                '[BusHandler] Usando primera ruta con código:',
                busFromNavigation.code,
              );
            }
          }

          if (route && route.path && route.path.length > 0) {
            const routeLayerId = `route-main-${route.id}`;
            routeExistsInMap =
              mapInstance.current?.getLayer(routeLayerId) !== undefined;
            const routeColor = route.color || generateRouteColor(route.code);

            const routePath = route.path || route.variants?.[0]?.path;

            if (routePath && routePath.length > 0) {
              if (!routeExistsInMap) {
                await clearAllRoutes();
                await clearAllBuses();
                if (currentMarker.current) {
                  currentMarker.current.remove();
                  currentMarker.current = null;
                }
              }

              const apiKey = getStadiaApiKey();
              const shouldApplyMapMatching = isMapMatchingAvailable();

              let processedPath = routePath;
              try {
                const processedRoute = await processRouteWithCoordinates(
                  routePath,
                  apiKey,
                  shouldApplyMapMatching,
                );
                processedPath = processedRoute.matchedGeometry.coordinates as [
                  number,
                  number,
                ][];
              } catch {
                processedPath = routePath;
              }

              const searchItem: SearchItem = {
                id: route.id,
                type: 'route',
                name: busFromNavigation.name,
                code: busFromNavigation.code,
                tags: [],
                coordinates: processedPath,
                color: routeColor,
                routeStops: route.stops?.map((stop) => ({
                  id: stop.id,
                  name: stop.name,
                  location: stop.location,
                })),
              };

              if (!routeExistsInMap) {
                await addRouteToMap(
                  searchItem.id,
                  processedPath,
                  {
                    color: '#10B981',
                    width: 4,
                    opacity: 0.5,
                    outlineColor: getRouteColor(
                      '--color-route-outline',
                      '#ffffff',
                    ),
                    outlineWidth: 4,
                    stopColor: '#10B981',
                    stopOpacity: 0.5,
                    endpointColor: '#10B981',
                    showShadow: false,
                  },
                  route.stops?.map((stop) => ({
                    id: stop.id,
                    name: stop.name,
                    created_at: stop.created_at || new Date().toISOString(),
                    location: stop.location,
                  })),
                );

                fitBoundsToRoute(processedPath, true);
                setSelectedItem(searchItem);
              }
              routeVariantId = route.id;
              console.log(
                '[BusHandler] Ruta encontrada, variantId:',
                routeVariantId,
              );
            } else {
              console.warn(
                '[BusHandler] Ruta encontrada pero sin path:',
                route,
              );
            }
          } else {
            console.warn('[BusHandler] No se encontró ruta para:', {
              id: busFromNavigation.id,
              code: busFromNavigation.code,
            });
          }
        } catch (error) {
          console.error('[BusHandler] Error al buscar ruta:', error);
        }

        // Intentar cargar buses incluso si no se encontró la ruta
        // Si no hay routeVariantId válido, aún podemos centrar en la ubicación del bus
        if (routeVariantId && routeVariantId !== busFromNavigation.code) {
          console.log('[BusHandler] Cargando buses para ruta:', routeVariantId);
          await loadBusesForRoute(routeVariantId, busFromNavigation.busId);
        } else {
          console.warn(
            '[BusHandler] No se pudo determinar routeVariantId, solo centrando en ubicación del bus',
          );
        }

        setTimeout(() => {
          if (busFromNavigation.busLocation && mapInstance.current) {
            mapInstance.current.flyTo({
              center: [
                busFromNavigation.busLocation.longitude,
                busFromNavigation.busLocation.latitude,
              ],
              zoom: 16,
              duration: 500,
            });
          }
        }, 1500);
      } catch {
        // Error silencioso
      } finally {
        setBusFromNavigation(null);
      }
    };

    processBusFromNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busFromNavigation]);

  return null;
}
