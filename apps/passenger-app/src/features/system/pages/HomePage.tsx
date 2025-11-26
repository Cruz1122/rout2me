import { useEffect, useRef, useCallback, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  RiAddLine,
  RiSubtractLine,
  RiCompassLine,
  RiDeleteBinLine,
  RiFocus3Line,
} from 'react-icons/ri';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import R2MSearchOverlay from '../../routes/components/R2MSearchOverlay';
import R2MMapInfoCard from '../../routes/components/R2MMapInfoCard';
import GlobalLoader from '../components/GlobalLoader';
import ErrorNotification from '../components/ErrorNotification';
import useErrorNotification from '../hooks/useErrorNotification';
import { useMapResize } from '../../../shared/hooks/useMapResize';
import { useRouteDrawing } from '../../routes/hooks/useRouteDrawing';
import { useBusMapping } from '../../routes/hooks/useBusMapping';
import { useUserLocationMarker } from '../hooks/useUserLocationMarker';
import { processRouteWithCoordinates } from '../../routes/services/mapMatchingService';
import { mapTileCacheService } from '../../routes/services/mapTileCacheService';
import {
  fetchBuses,
  getBusesByRouteVariant,
} from '../../routes/services/busService';
import {
  fetchAllRoutesData,
  recentRoutesStorage,
  generateRouteColor,
} from '../../routes/services/routeService';
import { recentSearchesStorage } from '../../routes/services/recentSearchService';
import { createStopMarkerElement } from '../../routes/utils/markerUtils';
import type { SearchItem } from '../../../shared/types/search';
import {
  getStadiaApiKey,
  isMapMatchingAvailable,
} from '../../../config/config';
import { useTheme } from '../../../contexts/ThemeContext';
import type { MarkerSelection } from '../../routes/components/R2MMapInfoCard';
import type { Stop } from '../../routes/services/routeService';
import type { Bus } from '../../routes/services/busService';
import '../../../debug/paradasDebug'; // Importar script de debug
import '../../../debug/apiTest'; // Importar script de prueba de API

// Helper para obtener colores de rutas desde CSS variables
const getRouteColor = (variable: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
};

export default function HomePage() {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const currentMarker = useRef<maplibregl.Marker | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerSelection | null>(
    null,
  );
  const [mapBearing, setMapBearing] = useState(0);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const { error, showError, clearError } = useErrorNotification();

  // Hook para gestionar el marcador de ubicación del usuario
  const { centerOnUserLocation } = useUserLocationMarker(mapInstance, {
    autoUpdate: true,
    updateInterval: 10000, // Actualizar cada 10 segundos
    enabled: isMapReady, // Solo activar cuando el mapa esté listo
    theme, // Pasar el tema para que el marcador cambie de color
  });
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

  interface BusFromNavigation {
    id: string;
    code: string;
    name: string;
    busId: string;
    busLocation: { latitude: number; longitude: number } | null;
  }

  const [routeFromNavigation, setRouteFromNavigation] =
    useState<RouteFromNavigation | null>(null);
  const [busFromNavigation, setBusFromNavigation] =
    useState<BusFromNavigation | null>(null);

  const { triggerResize } = useMapResize(mapInstance);

  // Callbacks para manejar clics en marcadores
  const handleStopClick = useCallback((stop: Stop, routeId: string) => {
    setSelectedMarker({ type: 'stop', data: stop });
    setSelectedItem(null); // Limpiar selectedItem si existe
  }, []);

  const handleBusClick = useCallback((bus: Bus) => {
    setSelectedMarker({ type: 'bus', data: bus });
    setSelectedItem(null); // Limpiar selectedItem si existe
  }, []);

  const handleEndpointClick = useCallback(
    (type: 'start' | 'end', coordinates: [number, number], routeId: string) => {
      setSelectedMarker({ type: 'endpoint', data: { type, coordinates } });
      setSelectedItem(null); // Limpiar selectedItem si existe
    },
    [],
  );

  const { addRouteToMap, clearAllRoutes, fitBoundsToRoute, highlightRoute } =
    useRouteDrawing(mapInstance, {
      onStopClick: handleStopClick,
      onEndpointClick: handleEndpointClick,
    });
  const { addBusesToMap, clearAllBuses } = useBusMapping(mapInstance, {
    onBusClick: handleBusClick,
  });

  // Función para cargar buses de una ruta específica
  const loadBusesForRoute = useCallback(
    async (routeVariantId: string, highlightedBusId?: string) => {
      try {
        // Cargar todos los buses
        const allBuses = await fetchBuses();

        // Filtrar buses que pertenecen a esta variante de ruta
        const routeBuses = getBusesByRouteVariant(allBuses, routeVariantId);

        // Mostrar buses en el mapa con el bus destacado si se especifica
        addBusesToMap(routeBuses, highlightedBusId);
      } catch {
        // Error silencioso
      }
    },
    [addBusesToMap],
  );

  const handleItemSelect = useCallback(
    async (item: SearchItem) => {
      if (!mapInstance.current) return;

      if (item.type === 'stop' && 'lat' in item && 'lng' in item) {
        recentSearchesStorage.saveRecentSearch({
          id: item.id,
          type: 'stop',
        });

        // Limpiar rutas y buses anteriores al seleccionar una parada
        clearAllRoutes();
        clearAllBuses();

        if (currentMarker.current) {
          currentMarker.current.remove();
        }

        mapInstance.current.flyTo({
          center: [item.lng, item.lat],
          zoom: 17,
          duration: 1000,
        });

        const markerElement = createStopMarkerElement({
          highlight: true,
        });

        currentMarker.current = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center',
        })
          .setLngLat([item.lng, item.lat])
          .addTo(mapInstance.current);

        setSelectedItem(item);
      } else if (
        item.type === 'route' &&
        'coordinates' in item &&
        item.coordinates
      ) {
        // Guardar la ruta como reciente
        recentRoutesStorage.saveRecentRoute(item.id);
        recentSearchesStorage.saveRecentSearch({
          id: item.id,
          type: 'route',
        });

        // Limpiar marcadores de paradas y buses
        if (currentMarker.current) {
          currentMarker.current.remove();
          currentMarker.current = null;
        }

        // Limpiar todas las rutas y buses anteriores antes de agregar la nueva
        clearAllRoutes();
        clearAllBuses();

        // Mostrar loader mientras se procesa el map matching
        setIsMapLoading(true);

        try {
          // Obtener la API key desde la configuración centralizada
          const apiKey = getStadiaApiKey();

          // Determinar si aplicar map matching basado en la disponibilidad de API key
          const shouldApplyMapMatching = isMapMatchingAvailable();

          // Procesar la ruta con coordenadas del backend
          // Aplicar map matching si hay API key disponible
          const processedRoute = await processRouteWithCoordinates(
            item.coordinates,
            apiKey,
            shouldApplyMapMatching, // Aplicar map matching si hay API key
          );

          // Usar las coordenadas procesadas para dibujar la ruta
          addRouteToMap(
            item.id,
            processedRoute.matchedGeometry.coordinates as [number, number][],
            {
              color: getRouteColor('--color-route-default', '#1E56A0'),
              width: 4,
              opacity: 0.9,
              outlineColor: getRouteColor('--color-route-outline', '#ffffff'),
              outlineWidth: 8,
            },
            // Pasar las paradas si están disponibles
            item.routeStops?.map((stop) => ({
              id: stop.id,
              name: stop.name,
              created_at: new Date().toISOString(),
              location: stop.location,
            })),
          );

          // Ajustar vista para mostrar toda la ruta
          // Usar padding extra en la parte inferior para evitar que la card tape la ruta
          fitBoundsToRoute(
            processedRoute.matchedGeometry.coordinates as [number, number][],
            true, // hasInfoCard = true, ya que siempre se muestra la card cuando se selecciona una ruta
          );

          // Resaltar la ruta seleccionada
          highlightRoute(item.id, true);

          // Cargar buses para esta ruta
          await loadBusesForRoute(item.id);

          // Precargar tiles después de ajustar la vista
          setTimeout(() => {
            if (mapInstance.current) {
              const center = mapInstance.current.getCenter();
              const zoom = mapInstance.current.getZoom();

              // Precargar tiles para evitar lag visual
              mapTileCacheService
                .preloadTiles([center.lng, center.lat], zoom, 2)
                .catch(() => {
                  // Error silencioso
                });
            }
          }, 2000);

          setSelectedItem(item);
          setSelectedMarker(null); // Limpiar selectedMarker cuando se selecciona desde búsqueda
        } catch {
          // Error silencioso
          // Fallback: usar coordenadas originales si falla el procesamiento
          // Dibujar la ruta en el mapa usando colores del tema actual
          addRouteToMap(item.id, item.coordinates, {
            color: getRouteColor('--color-route-default', '#1E56A0'),
            width: 4,
            opacity: 0.9,
            outlineColor: getRouteColor('--color-route-outline', '#ffffff'),
            outlineWidth: 8,
            stopColor: getRouteColor('--color-route-stop', '#FF6B35'),
            endpointColor: getRouteColor('--color-route-endpoint', '#1E56A0'),
          });
          fitBoundsToRoute(item.coordinates, true); // hasInfoCard = true
          highlightRoute(item.id, true);

          // Cargar buses para esta ruta (fallback)
          await loadBusesForRoute(item.id);

          // Precargar tiles después de ajustar la vista (fallback)
          setTimeout(() => {
            if (mapInstance.current) {
              const center = mapInstance.current.getCenter();
              const zoom = mapInstance.current.getZoom();

              // Precargar tiles para evitar lag visual
              mapTileCacheService
                .preloadTiles([center.lng, center.lat], zoom, 2)
                .catch(() => {
                  // Error silencioso
                });
            }
          }, 2000);

          setSelectedItem(item);
          setSelectedMarker(null); // Limpiar selectedMarker cuando se selecciona desde búsqueda
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
    ],
  );

  // El hook useUserLocationMarker maneja automáticamente la actualización del marcador

  const handleLocationRequest = useCallback(() => {
    if (!mapInstance.current) {
      return;
    }

    if (!navigator.geolocation) {
      showError('Tu navegador no soporta geolocalización');
      return;
    }

    // Usar el hook para centrar en la ubicación del usuario
    centerOnUserLocation(16);
  }, [showError, centerOnUserLocation]);

  const handleZoomIn = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.zoomOut({ duration: 300 });
  }, []);

  const [isDraggingCompass, setIsDraggingCompass] = useState(false);
  const [isClearingRoutes, setIsClearingRoutes] = useState(false);

  const handleClearRoutes = useCallback(() => {
    if (isClearingRoutes) return; // Prevenir múltiples clicks

    setIsClearingRoutes(true);

    // Limpiar rutas, buses y marcadores (pero NO el marcador de ubicación del usuario)
    clearAllRoutes();
    clearAllBuses();
    setSelectedItem(null);
    if (currentMarker.current) {
      currentMarker.current.remove();
      currentMarker.current = null;
    }
    // El marcador de ubicación del usuario se mantiene en el mapa

    // Feedback visual con vibración si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Resetear el estado visual después de la animación
    setTimeout(() => {
      setIsClearingRoutes(false);
    }, 300);
  }, [clearAllRoutes, clearAllBuses, isClearingRoutes]);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    bearing: number;
  } | null>(null);

  const handleResetBearing = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 500,
    });
  }, []);

  const handleCompassMouseDown = useCallback((e: React.MouseEvent) => {
    if (!mapInstance.current) return;
    e.preventDefault();
    setIsDraggingCompass(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      bearing: mapInstance.current.getBearing(),
    });
  }, []);

  const handleCompassTouchStart = useCallback((e: React.TouchEvent) => {
    if (!mapInstance.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    setIsDraggingCompass(true);
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      bearing: mapInstance.current.getBearing(),
    });
  }, []);

  const handleCompassMove = useCallback(
    (clientX: number) => {
      if (!mapInstance.current || !isDraggingCompass || !dragStart) return;

      const deltaX = clientX - dragStart.x;
      const newBearing = dragStart.bearing + deltaX;

      mapInstance.current.setBearing(newBearing);
      setMapBearing(newBearing);
    },
    [isDraggingCompass, dragStart],
  );

  const handleCompassEnd = useCallback(() => {
    setIsDraggingCompass(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (!isDraggingCompass) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleCompassMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleCompassMove(touch.clientX);
    };

    const handleMouseUp = () => handleCompassEnd();
    const handleTouchEnd = () => handleCompassEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingCompass, handleCompassMove, handleCompassEnd]);

  // Inicialización del mapa - optimizado para carga rápida
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      // Tiles de CARTO en alta resolución: Positron para modo claro, Dark Matter para modo oscuro
      style: {
        version: 8,
        sources: {
          'carto-tiles': {
            type: 'raster',
            tiles:
              theme === 'dark'
                ? [
                    'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                  ]
                : [
                    'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
                    'https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
                    'https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
                    'https://d.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png',
                  ],
            tileSize: 512, // Tiles @2x son 512x512
            attribution: '© OpenStreetMap contributors © CARTO',
            maxzoom: 19,
            // Configuración mejorada para caché
            scheme: 'xyz',
          },
        },
        layers: [
          {
            id: 'carto-tiles-layer',
            type: 'raster',
            source: 'carto-tiles',
            // Optimizar transiciones
            paint: {
              'raster-fade-duration': 300,
            },
          },
        ],
      },
      center: [-75.5138, 5.0703],
      zoom: 15,
      maxZoom: 19,
      minZoom: 5, // Evitar cargar tiles innecesarios en zoom muy alejado
      hash: false, // Deshabilitar URL hash para mejor rendimiento
      trackResize: true,
      // Opciones de rendimiento que no afectan calidad visual
      fadeDuration: 300, // Animación de fade suave pero rápida
      crossSourceCollisions: false, // Mejor rendimiento en labels
      refreshExpiredTiles: false, // No refrescar tiles automáticamente
      // Caché de tiles optimizado
      maxTileCacheSize: 200, // Aumentar caché para reusar tiles
      // Configuración adicional para evitar tiles faltantes
      renderWorldCopies: false, // Evitar renderizar copias del mundo
    });

    map.on('load', () => {
      setIsMapLoading(false);
      setIsMapReady(true); // Marcar el mapa como listo para activar el marcador

      // En modo oscuro, aplicar un ligero tinte Fiord al mapa base
      if (theme === 'dark') {
        try {
          map.setPaintProperty('carto-tiles-layer', 'raster-opacity', 0.85);
        } catch {
          // Si por alguna razón la capa aún no existe, no romper la carga
        }
      }

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
              enableHighAccuracy: false, // Cambiar a false para más velocidad inicial
              timeout: 3000, // Reducir timeout
              maximumAge: 30000, // Permitir caché de ubicación
            },
          );
        }
      }, 100); // Delay para no bloquear el render inicial
    });

    map.on('idle', () => {
      setIsMapLoading(false);
    });

    map.on('error', () => {
      setIsMapLoading(false);
    });

    map.on('rotate', () => {
      setMapBearing(map.getBearing());
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // Inicialización inmediata sin dependencias

  // Manejar ruta que viene desde RoutesPage
  useIonViewWillEnter(() => {
    const routeData = (globalThis as { routeData?: RouteFromNavigation })
      .routeData;
    if (routeData) {
      setRouteFromNavigation(routeData);
      // Limpiar la data después de usarla
      delete (globalThis as { routeData?: RouteFromNavigation }).routeData;
    }

    // Manejar bus que viene desde LivePage
    const busData = (globalThis as { busData?: BusFromNavigation }).busData;
    if (busData) {
      setBusFromNavigation(busData);
      // Limpiar la data después de usarla
      delete (globalThis as { busData?: BusFromNavigation }).busData;
    }
  });

  // Procesar ruta cuando esté disponible y el mapa esté listo
  useEffect(() => {
    if (!routeFromNavigation || !mapInstance.current) return;

    const processRouteFromNavigation = async () => {
      try {
        // Limpiar rutas anteriores
        clearAllRoutes();
        if (currentMarker.current) {
          currentMarker.current.remove();
          currentMarker.current = null;
        }

        // Mostrar loader mientras se procesa
        setIsMapLoading(true);

        // Obtener la API key desde la configuración centralizada
        const apiKey = getStadiaApiKey();
        const shouldApplyMapMatching = isMapMatchingAvailable();

        // Procesar la ruta con coordenadas
        const processedRoute = await processRouteWithCoordinates(
          routeFromNavigation.path,
          apiKey,
          shouldApplyMapMatching,
        );

        // Crear objeto SearchItem compatible
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

        // Dibujar la ruta en el mapa usando colores del tema actual
        addRouteToMap(
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

        // Ajustar vista para mostrar toda la ruta
        fitBoundsToRoute(
          processedRoute.matchedGeometry.coordinates as [number, number][],
          true, // hasInfoCard = true
        );

        // Resaltar la ruta
        highlightRoute(searchItem.id, true);

        // Cargar buses para esta ruta
        await loadBusesForRoute(searchItem.id);

        // Precargar tiles
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

        // NO re-renderizar el marcador - mantener el marcador existente intacto
        // El marcador de ubicación ya tiene su posición correcta y no debe tocarse
      } catch {
        // Error silencioso
        // Fallback: usar coordenadas originales
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

        // Dibujar la ruta en el mapa usando colores del tema actual (fallback)
        addRouteToMap(searchItem.id, searchItem.coordinates!, {
          color: getRouteColor('--color-route-default', '#1E56A0'),
          width: 4,
          opacity: 0.9,
          outlineColor: getRouteColor('--color-route-outline', '#ffffff'),
          outlineWidth: 8,
          stopColor: getRouteColor('--color-route-stop', '#FF6B35'),
          endpointColor: getRouteColor('--color-route-endpoint', '#1E56A0'),
        });
        fitBoundsToRoute(searchItem.coordinates!, true); // hasInfoCard = true
        highlightRoute(searchItem.id, true);

        // Cargar buses para esta ruta (fallback)
        await loadBusesForRoute(searchItem.id);

        setSelectedItem(searchItem);

        // NO re-renderizar el marcador - mantener el marcador existente intacto
        // El marcador de ubicación ya tiene su posición correcta y no debe tocarse
      } finally {
        setIsMapLoading(false);
        setRouteFromNavigation(null); // Limpiar después de procesar
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
  ]);

  // Procesar bus cuando esté disponible y el mapa esté listo
  useEffect(() => {
    if (!busFromNavigation || !mapInstance.current) return;

    const processBusFromNavigation = async () => {
      try {
        // Limpiar rutas y buses anteriores
        clearAllRoutes();
        clearAllBuses();
        if (currentMarker.current) {
          currentMarker.current.remove();
          currentMarker.current = null;
        }

        // Cargar la ruta completa para mostrar su geometría
        let routeVariantId = busFromNavigation.id;

        try {
          const routes = await fetchAllRoutesData();

          // Buscar la ruta (cada variante es una ruta independiente)
          // Primero intentar encontrar por ID directo
          let route = routes.find((r) => r.id === busFromNavigation.id);

          // Si no se encuentra por ID, buscar por código de ruta
          if (!route) {
            route = routes.find((r) => r.code === busFromNavigation.code);
          }

          // Si aún no se encuentra, buscar cualquier ruta con el mismo código
          if (!route) {
            const routesWithSameCode = routes.filter(
              (r) => r.code === busFromNavigation.code,
            );
            if (routesWithSameCode.length > 0) {
              route = routesWithSameCode[0];
            }
          }

          if (route && route.path && route.path.length > 0) {
            // Obtener el color de la ruta
            const routeColor = route.color || generateRouteColor(route.code);

            // Usar el path de la ruta (cada ruta ya es una variante con path)
            const routePath = route.path || route.variants?.[0]?.path;

            if (routePath && routePath.length > 0) {
              // Obtener la API key desde la configuración centralizada
              const apiKey = getStadiaApiKey();
              const shouldApplyMapMatching = isMapMatchingAvailable();

              // Procesar la ruta con map matching si está disponible
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
                // Si falla el map matching, usar el path original
                processedPath = routePath;
              }

              // Crear SearchItem con coordenadas reales
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

              // Agregar la ruta al mapa con opacidad menor y color verde (solo para buses)
              addRouteToMap(
                searchItem.id,
                processedPath,
                {
                  color: '#10B981', // Verde para rutas de buses (mantener verde)
                  width: 4,
                  opacity: 0.5, // Opacidad menor para ruta y paradas
                  outlineColor: getRouteColor(
                    '--color-route-outline',
                    '#ffffff',
                  ),
                  outlineWidth: 4, // Contorno reducido para buses
                  stopColor: '#10B981', // Color verde para marcadores de paradas
                  stopOpacity: 0.5, // Opacidad menor para marcadores de paradas
                  endpointColor: '#10B981',
                  showShadow: false,
                },
                // Agregar paradas de la ruta (con opacidad menor)
                route.stops?.map((stop) => ({
                  id: stop.id,
                  name: stop.name,
                  created_at: stop.created_at || new Date().toISOString(),
                  location: stop.location,
                })),
              );

              // Ajustar el mapa para mostrar toda la ruta
              fitBoundsToRoute(processedPath, true); // hasInfoCard = true

              // NO resaltar la ruta (ya tiene color verde y opacidad menor)
              // highlightRoute(searchItem.id, true);

              setSelectedItem(searchItem);
              routeVariantId = route.id;
            }
          }
        } catch {
          // Error silencioso
        }

        // Cargar buses para esta ruta usando el ID de la variante
        // No mostrar loader aquí para evitar parpadeo - los buses se cargan en segundo plano
        await loadBusesForRoute(routeVariantId, busFromNavigation.busId);

        // Esperar unos segundos antes de hacer zoom al bus destacado
        // Esto permite que el usuario vea toda la ruta primero
        setTimeout(() => {
          // Centrar la cámara en el bus específico después de unos segundos
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
        }, 3000); // Esperar 3 segundos antes de hacer zoom

        // NO re-renderizar el marcador - mantener el marcador existente intacto
        // El marcador de ubicación ya tiene su posición correcta y no debe tocarse
      } catch {
        // Error silencioso
      } finally {
        // Limpiar después de procesar
        setBusFromNavigation(null);
      }
    };

    processBusFromNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busFromNavigation]);

  useIonViewDidEnter(() => {
    if (mapInstance.current) {
      setTimeout(() => {
        mapInstance.current?.resize();
      }, 100);
    }
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Inicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-no-padding">
        <div
          ref={mapRef}
          style={{
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1,
            touchAction: 'pan-x pan-y',
            backgroundColor:
              theme === 'dark' ? 'var(--color-map-fiord)' : 'var(--color-bg)',
          }}
        />

        {/* Indicador de carga del mapa */}
        {isMapLoading && <GlobalLoader />}

        <div className="fixed top-4 left-4 right-4 z-50" slot="fixed">
          <R2MSearchOverlay
            onItemSelect={handleItemSelect}
            onLayoutChange={triggerResize}
          />
        </div>

        <div
          className="fixed top-20 right-4 z-40 flex flex-col gap-2"
          slot="fixed"
        >
          <button
            onClick={handleZoomIn}
            className="w-12 h-12 rounded-full backdrop-blur-lg 
                       flex items-center justify-center transition-all duration-200
                       hover:scale-105 active:scale-95 shadow-lg
                       opacity-40 hover:opacity-100"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: `1px solid rgba(var(--color-surface-rgb), 0.3)`,
              borderRadius: '50%',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
            aria-label="Acercar"
          >
            <RiAddLine size={20} style={{ color: '#000000' }} />
          </button>

          <button
            onClick={handleZoomOut}
            className="w-12 h-12 rounded-full backdrop-blur-lg 
                       flex items-center justify-center transition-all duration-200
                       hover:scale-105 active:scale-95 shadow-lg
                       opacity-40 hover:opacity-100"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: `1px solid rgba(var(--color-surface-rgb), 0.3)`,
              borderRadius: '50%',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
            aria-label="Alejar"
          >
            <RiSubtractLine size={20} style={{ color: '#000000' }} />
          </button>

          <button
            onClick={handleResetBearing}
            onMouseDown={handleCompassMouseDown}
            onTouchStart={handleCompassTouchStart}
            className={`w-12 h-12 rounded-full backdrop-blur-lg 
                       flex items-center justify-center transition-all duration-200
                       hover:scale-105 active:scale-95 shadow-lg select-none
                       ${isDraggingCompass ? 'cursor-grabbing scale-105 opacity-100' : 'cursor-pointer opacity-40 hover:opacity-100'}`}
            style={{
              backgroundColor: isDraggingCompass
                ? 'rgba(30, 86, 160, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid rgba(var(--color-surface-rgb), 0.3)`,
              borderRadius: '50%',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
            aria-label="Arrastrar para rotar - Click para resetear"
          >
            <RiCompassLine
              size={20}
              style={{
                color: isDraggingCompass ? '#FFFFFF' : '#000000',
                transform: `rotate(${mapBearing}deg)`,
                transition: isDraggingCompass ? 'none' : 'transform 0.2s ease',
              }}
            />
          </button>

          <button
            onClick={handleLocationRequest}
            className="w-12 h-12 rounded-full backdrop-blur-lg 
                       flex items-center justify-center transition-all duration-200
                       hover:scale-105 active:scale-95 shadow-lg
                       opacity-40 hover:opacity-100"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: `1px solid rgba(var(--color-surface-rgb), 0.3)`,
              borderRadius: '50%',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
            aria-label="Mi ubicación"
          >
            <RiFocus3Line size={20} style={{ color: '#000000' }} />
          </button>

          <button
            onClick={handleClearRoutes}
            disabled={isClearingRoutes}
            className={`w-12 h-12 rounded-full backdrop-blur-lg 
                       flex items-center justify-center transition-all duration-300 ease-out
                       hover:scale-105 active:scale-95 shadow-lg
                       ${isClearingRoutes ? 'scale-95 opacity-100' : 'cursor-pointer opacity-40 hover:opacity-100'}
                       disabled:cursor-not-allowed`}
            style={{
              backgroundColor: isClearingRoutes
                ? 'rgba(220, 38, 38, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isClearingRoutes ? 'rgba(220, 38, 38, 0.5)' : 'rgba(var(--color-surface-rgb), 0.3)'}`,
              borderRadius: '50%',
              boxShadow: isClearingRoutes
                ? '0 10px 25px -5px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.2)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transform: isClearingRoutes ? 'scale(0.95)' : 'scale(1)',
            }}
            aria-label="Limpiar rutas"
          >
            <RiDeleteBinLine
              size={20}
              style={{
                color: isClearingRoutes ? '#FFFFFF' : '#000000',
                transform: isClearingRoutes
                  ? 'translateY(-2px)'
                  : 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
              }}
            />
          </button>
        </div>

        <R2MMapInfoCard
          selectedItem={selectedItem}
          selectedMarker={selectedMarker}
          onClose={() => {
            const lastSelected = selectedItem;
            setSelectedItem(null);
            setSelectedMarker(null);
            // Mantener el marcador del paradero hasta que se seleccione otra cosa
            if (lastSelected?.type !== 'stop' && currentMarker.current) {
              currentMarker.current.remove();
              currentMarker.current = null;
            }
          }}
        />
      </IonContent>
      <ErrorNotification error={error} onClose={clearError} />
    </IonPage>
  );
}
