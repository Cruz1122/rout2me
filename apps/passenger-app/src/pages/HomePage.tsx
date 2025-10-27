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
  RiFocus3Line,
  RiAddLine,
  RiSubtractLine,
  RiCompassLine,
  RiDeleteBinLine,
} from 'react-icons/ri';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import R2MSearchOverlay from '../components/R2MSearchOverlay';
import R2MMapInfoCard from '../components/R2MMapInfoCard';
import GlobalLoader from '../components/GlobalLoader';
import { useMapResize } from '../hooks/useMapResize';
import { useRouteDrawing } from '../hooks/useRouteDrawing';
import { useBusMapping } from '../hooks/useBusMapping';
import { processRouteWithCoordinates } from '../services/mapMatchingService';
import { mapTileCacheService } from '../services/mapTileCacheService';
import { fetchBuses, getBusesByRouteVariant } from '../services/busService';
import { fetchRoutesWithStops } from '../services/routeService';
import type { SearchItem } from '../types/search';
import '../debug/paradasDebug'; // Importar script de debug
import '../debug/apiTest'; // Importar script de prueba de API

export default function HomePage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const currentMarker = useRef<maplibregl.Marker | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [mapBearing, setMapBearing] = useState(0);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [shouldInitMap, setShouldInitMap] = useState(false);
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
  const { addRouteToMap, clearAllRoutes, fitBoundsToRoute, highlightRoute } =
    useRouteDrawing(mapInstance);
  const { addBusesToMap, clearAllBuses } = useBusMapping(mapInstance);

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

        console.log(
          `Cargados ${routeBuses.length} buses para la ruta ${routeVariantId}`,
        );
      } catch (error) {
        console.error('Error cargando buses para la ruta:', error);
      }
    },
    [addBusesToMap],
  );

  const handleItemSelect = useCallback(
    async (item: SearchItem) => {
      if (!mapInstance.current) return;

      if (item.type === 'stop' && 'lat' in item && 'lng' in item) {
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

        currentMarker.current = new maplibregl.Marker({
          color: 'var(--color-secondary)', // #1E56A0
        })
          .setLngLat([item.lng, item.lat])
          .addTo(mapInstance.current);

        setSelectedItem(item);
      } else if (
        item.type === 'route' &&
        'coordinates' in item &&
        item.coordinates
      ) {
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
          // Obtener la API key desde las variables de entorno
          const apiKey = import.meta.env.VITE_STADIA_API_KEY;

          // Determinar si aplicar map matching basado en la disponibilidad de API key
          const shouldApplyMapMatching = Boolean(
            apiKey && apiKey.trim() !== '',
          );

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
              color: item.color || 'var(--color-secondary)', // Usar color de la ruta si está disponible
              width: 4,
              opacity: 0.9,
              outlineColor: '#ffffff',
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
          fitBoundsToRoute(
            processedRoute.matchedGeometry.coordinates as [number, number][],
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
                .catch((error) =>
                  console.warn('Error precargando tiles:', error),
                );
            }
          }, 2000);

          setSelectedItem(item);
        } catch (error) {
          console.error('Error processing route:', error);
          // Fallback: usar coordenadas originales si falla el procesamiento
          addRouteToMap(item.id, item.coordinates, {
            color: item.color || 'var(--color-secondary)', // Usar color de la ruta si está disponible
            width: 4,
            opacity: 0.9,
            outlineColor: '#ffffff',
            outlineWidth: 8,
          });
          fitBoundsToRoute(item.coordinates);
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
                .catch((error) =>
                  console.warn('Error precargando tiles (fallback):', error),
                );
            }
          }, 2000);

          setSelectedItem(item);
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

  const handleLocationRequest = useCallback(() => {
    if (!mapInstance.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.current?.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 1500,
          });

          new maplibregl.Marker({
            color: 'var(--color-accent)', // #1E56A0 (usando accent para diferenciar)
          })
            .setLngLat([longitude, latitude])
            .addTo(mapInstance.current!);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        },
      );
    }
  }, []);

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

    // Limpiar rutas, buses y marcadores
    clearAllRoutes();
    clearAllBuses();
    setSelectedItem(null);
    if (currentMarker.current) {
      currentMarker.current.remove();
      currentMarker.current = null;
    }

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

  // Lazy loading: inicializar solo cuando el contenedor sea visible
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldInitMap(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(mapRef.current);

    return () => observer.disconnect();
  }, []);

  // Inicialización del mapa con tiles vectoriales
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !shouldInitMap) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      // Tiles optimizadas de CARTO pero con mejor configuración de caché
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
            // Configuración mejorada para caché
            scheme: 'xyz',
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
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
      console.log('Mapa cargado correctamente');
      setIsMapLoading(false);
    });

    map.on('idle', () => {
      setIsMapLoading(false);
    });

    map.on('error', (e) => {
      console.error('Error al cargar el mapa:', e);
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
  }, [shouldInitMap]);

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

        // Obtener la API key desde las variables de entorno
        const apiKey = import.meta.env.VITE_STADIA_API_KEY;
        const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

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

        // Dibujar la ruta en el mapa
        addRouteToMap(
          searchItem.id,
          processedRoute.matchedGeometry.coordinates as [number, number][],
          {
            color: searchItem.color,
            width: 4,
            opacity: 0.9,
            outlineColor: '#ffffff',
            outlineWidth: 8,
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
              .catch((error) =>
                console.warn('Error precargando tiles:', error),
              );
          }
        }, 2000);

        setSelectedItem(searchItem);
      } catch (error) {
        console.error('Error processing route from navigation:', error);
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

        addRouteToMap(searchItem.id, searchItem.coordinates!, {
          color: searchItem.color,
          width: 4,
          opacity: 0.9,
          outlineColor: '#ffffff',
          outlineWidth: 8,
        });
        fitBoundsToRoute(searchItem.coordinates!);
        highlightRoute(searchItem.id, true);

        // Cargar buses para esta ruta (fallback)
        await loadBusesForRoute(searchItem.id);

        setSelectedItem(searchItem);
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

        // Mostrar loader mientras se procesa
        setIsMapLoading(true);

        // Cargar la ruta completa para mostrar su geometría
        let routeVariantId = busFromNavigation.id;

        try {
          const routes = await fetchRoutesWithStops();

          // Buscar la ruta que contiene la variante con el ID del bus
          let route = null;
          let variant = null;

          // Primero intentar encontrar por ID directo de ruta
          route = routes.find((r) => r.id === busFromNavigation.id);
          if (route?.variants?.length) {
            variant = route.variants[0];
            routeVariantId = variant.id;
          } else {
            // Si no se encuentra, buscar por activeRouteVariantId en las variantes
            for (const r of routes) {
              if (r.variants) {
                const foundVariant = r.variants.find(
                  (v) => v.id === busFromNavigation.id,
                );
                if (foundVariant) {
                  route = r;
                  variant = foundVariant;
                  routeVariantId = variant.id;
                  break;
                }
              }
            }
          }

          if (route && variant && variant.path && variant.path.length > 0) {
            // Crear SearchItem con coordenadas reales
            const searchItem: SearchItem = {
              id: variant.id, // Usar el ID de la variante
              type: 'route',
              name: busFromNavigation.name,
              code: busFromNavigation.code,
              tags: [],
              coordinates: variant.path,
              color: route.color || 'var(--color-secondary)',
            };

            // Agregar la ruta al mapa
            addRouteToMap(searchItem.id, variant.path, {
              color: searchItem.color,
              width: 4,
              opacity: 0.9,
              outlineColor: '#ffffff',
              outlineWidth: 8,
            });

            // Ajustar el mapa para mostrar toda la ruta
            fitBoundsToRoute(variant.path);

            // Resaltar la ruta
            highlightRoute(searchItem.id, true);

            setSelectedItem(searchItem);
          } else {
            console.warn(
              'No se encontró la ruta o variante para el bus:',
              busFromNavigation,
            );
          }
        } catch (error) {
          console.error('Error cargando ruta para el bus:', error);
        }

        // Mostrar loader mientras se cargan los buses
        setIsMapLoading(true);

        // Cargar buses para esta ruta usando el ID de la variante
        await loadBusesForRoute(routeVariantId, busFromNavigation.busId);

        // Centrar la cámara en el bus específico
        if (busFromNavigation.busLocation && mapInstance.current) {
          mapInstance.current.flyTo({
            center: [
              busFromNavigation.busLocation.longitude,
              busFromNavigation.busLocation.latitude,
            ],
            zoom: 16,
            duration: 1500,
          });
        }
      } catch (error) {
        console.error('Error processing bus from navigation:', error);
      } finally {
        setIsMapLoading(false);
        setBusFromNavigation(null); // Limpiar después de procesar
      }
    };

    processBusFromNavigation();
  }, [
    busFromNavigation,
    mapInstance,
    clearAllRoutes,
    clearAllBuses,
    loadBusesForRoute,
    addRouteToMap,
    fitBoundsToRoute,
    highlightRoute,
  ]);

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
                       hover:scale-105 active:scale-95 shadow-lg"
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
                       hover:scale-105 active:scale-95 shadow-lg"
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
                       ${isDraggingCompass ? 'cursor-grabbing scale-105' : 'cursor-pointer'}`}
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
                       hover:scale-105 active:scale-95 shadow-lg"
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
                       ${isClearingRoutes ? 'scale-95' : 'cursor-pointer'}
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
          onClose={() => {
            setSelectedItem(null);
            // Solo limpiar marcadores de paradas cuando se cierra la tarjeta
            // Las rutas se mantienen en el mapa
            if (currentMarker.current) {
              currentMarker.current.remove();
              currentMarker.current = null;
            }
          }}
        />
      </IonContent>
    </IonPage>
  );
}
