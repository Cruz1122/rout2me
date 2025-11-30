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
import maplibregl from 'maplibre-gl';
import R2MSearchOverlay from '../../routes/components/R2MSearchOverlay';
import R2MMapInfoCard from '../../routes/components/R2MMapInfoCard';
import GlobalLoader from '../components/GlobalLoader';
import R2MErrorToast from '../../../shared/components/R2MErrorToast';
import MapContainer from '../components/MapContainer';
import MapControls from '../components/MapControls';
import { RouteHandler } from '../components/RouteHandler';
import { BusHandler } from '../components/BusHandler';
import useErrorNotification from '../hooks/useErrorNotification';
import { useMapResize } from '../../../shared/hooks/useMapResize';
import { useRouteDrawing } from '../../routes/hooks/useRouteDrawing';
import { useBusMapping } from '../../routes/hooks/useBusMapping';
import { useBusRealtime } from '../../routes/hooks/useBusRealtime';
import { useUserLocationMarker } from '../hooks/useUserLocationMarker';
import { useMapInitialization } from '../hooks/useMapInitialization';
import { useMapEventHandlers } from '../hooks/useMapEventHandlers';
import { useRouteSelection } from '../hooks/useRouteSelection';
import {
  fetchBuses,
  getBusesByRouteVariant,
} from '../../routes/services/busService';
import type { SearchItem } from '../../../shared/types/search';
import { useTheme } from '../../../contexts/ThemeContext';
import type { MarkerSelection } from '../../routes/components/R2MMapInfoCard';
import type { Stop } from '../../routes/services/routeService';
import type { Bus } from '../../routes/services/busService';
import { isDevelopment } from '../../../config/developmentConfig';

// Importar scripts de debug solo en desarrollo
if (isDevelopment()) {
  import('../../../debug/paradasDebug').catch(() => {
    // Ignorar errores de importación de debug
  });
  import('../../../debug/apiTest').catch(() => {
    // Ignorar errores de importación de debug
  });
}

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

export default function HomePage() {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const currentMarker = useRef<maplibregl.Marker | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerSelection | null>(
    null,
  );
  const [routeFromNavigation, setRouteFromNavigation] =
    useState<RouteFromNavigation | null>(null);
  const [busFromNavigation, setBusFromNavigation] =
    useState<BusFromNavigation | null>(null);
  const { error, showError, clearError } = useErrorNotification();

  // Hook para inicialización del mapa
  const { mapInstance, isMapLoading, isMapReady, isOnline, setIsMapLoading } =
    useMapInitialization(mapRef);

  // Hook para eventos del mapa
  const { mapBearing, setMapBearing, setupMapEvents } =
    useMapEventHandlers(mapInstance);

  // Configurar eventos cuando el mapa esté listo
  useEffect(() => {
    if (mapInstance.current && isMapReady) {
      setupMapEvents(mapInstance.current);
    }
  }, [mapInstance, isMapReady, setupMapEvents]);

  // Hook para gestionar el marcador de ubicación del usuario
  const { centerOnUserLocation } = useUserLocationMarker(mapInstance, {
    autoUpdate: true,
    updateInterval: 10000,
    enabled: isMapReady,
    theme,
  });

  const { triggerResize } = useMapResize(mapInstance);

  // Callbacks para manejar clics en marcadores
  const handleStopClick = useCallback((stop: Stop) => {
    setSelectedMarker({ type: 'stop', data: stop });
    setSelectedItem(null); // Limpiar selectedItem si existe
  }, []);

  const handleBusClick = useCallback((bus: Bus) => {
    setSelectedMarker({ type: 'bus', data: bus });
    setSelectedItem(null); // Limpiar selectedItem si existe
  }, []);

  const handleEndpointClick = useCallback(
    (type: 'start' | 'end', coordinates: [number, number]) => {
      setSelectedMarker({ type: 'endpoint', data: { type, coordinates } });
      setSelectedItem(null); // Limpiar selectedItem si existe
    },
    [],
  );

  const {
    addRouteToMap,
    clearAllRoutes,
    fitBoundsToRoute,
    highlightRoute,
    getRouteIdForStop,
  } = useRouteDrawing(mapInstance, {
    onStopClick: handleStopClick,
    onEndpointClick: handleEndpointClick,
  });
  const { addBusesToMap, clearAllBuses, updateBusOnMap } = useBusMapping(
    mapInstance,
    {
      onBusClick: handleBusClick,
    },
  );

  // Cache de buses para actualizaciones en tiempo real
  const busesCacheRef = useRef<Map<string, Bus>>(new Map());
  const busesOnMapRef = useRef<Set<string>>(new Set());

  // Función para cargar buses de una ruta específica
  const loadBusesForRoute = useCallback(
    async (routeVariantId: string, highlightedBusId?: string) => {
      try {
        // Cargar todos los buses
        const allBuses = await fetchBuses();

        // Actualizar cache de buses y usar datos del cache si están más actualizados
        allBuses.forEach((bus) => {
          // Si hay un bus en cache, preferir el cache (puede tener datos más recientes de Realtime)
          // Pero si el bus recién cargado tiene una timestamp más reciente, usar ese
          busesCacheRef.current.set(bus.id, bus);
        });

        // Filtrar buses que pertenecen a esta variante de ruta
        let routeBuses = getBusesByRouteVariant(allBuses, routeVariantId);

        // Si algún bus en el cache es más reciente y pertenece a la ruta, usarlo
        routeBuses = routeBuses.map((bus) => {
          const cachedBus = busesCacheRef.current.get(bus.id);
          // Usar el bus del cache si existe (puede tener actualizaciones de Realtime)
          return cachedBus || bus;
        });

        // Actualizar conjunto de buses visibles en el mapa
        busesOnMapRef.current.clear();
        routeBuses.forEach((bus) => {
          busesOnMapRef.current.add(bus.id);
        });

        // Mostrar buses en el mapa con el bus destacado si se especifica
        addBusesToMap(routeBuses, highlightedBusId);
      } catch {
        // Error silencioso
      }
    },
    [addBusesToMap],
  );

  // Callback para manejar actualizaciones en tiempo real de buses
  const handleBusUpdate = useCallback(
    (updatedBus: Bus) => {
      console.log('[HomePage] Bus actualizado en tiempo real:', updatedBus.id);

      // Actualizar cache
      busesCacheRef.current.set(updatedBus.id, updatedBus);

      // Verificar si el bus está visible en el mapa
      const isBusOnMap = busesOnMapRef.current.has(updatedBus.id);

      // Si el bus está offline o no tiene ubicación, removerlo del tracking
      if (updatedBus.status === 'offline' || !updatedBus.location) {
        if (isBusOnMap) {
          console.log(
            '[HomePage] Removiendo bus del mapa (offline o sin ubicación):',
            updatedBus.id,
          );
          busesOnMapRef.current.delete(updatedBus.id);
        }
        // updateBusOnMap manejará la remoción visual
      }

      // Si el bus está visible en el mapa, actualizarlo
      if (isBusOnMap) {
        console.log('[HomePage] Actualizando bus en el mapa:', updatedBus.id);
        updateBusOnMap(updatedBus);
      } else {
        console.log(
          '[HomePage] Bus no está visible en el mapa:',
          updatedBus.id,
        );
      }

      // Si el info card está mostrando este bus, actualizarlo también
      setSelectedMarker((prevMarker) => {
        if (
          prevMarker &&
          prevMarker.type === 'bus' &&
          prevMarker.data.id === updatedBus.id
        ) {
          console.log(
            '[HomePage] Actualizando bus en el info card:',
            updatedBus.id,
          );
          return {
            type: 'bus' as const,
            data: updatedBus,
          };
        }
        return prevMarker;
      });
    },
    [updateBusOnMap],
  );

  // Hook para suscripciones en tiempo real de buses
  useBusRealtime({
    onBusUpdate: handleBusUpdate,
    onError: (error) => {
      console.error('Error en suscripción Realtime de buses:', error);
      // No mostrar error al usuario para no interrumpir la experiencia
    },
  });

  // Hook para selección de rutas
  const { handleItemSelect } = useRouteSelection({
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
  });

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
  }, [mapInstance, showError, centerOnUserLocation]);

  const handleZoomIn = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.zoomIn({ duration: 300 });
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.zoomOut({ duration: 300 });
  }, [mapInstance]);

  const [isDraggingCompass, setIsDraggingCompass] = useState(false);
  const [isClearingRoutes, setIsClearingRoutes] = useState(false);

  const handleClearRoutes = useCallback(async () => {
    if (isClearingRoutes) return; // Prevenir múltiples clicks

    setIsClearingRoutes(true);

    // Limpiar rutas, buses y marcadores (pero NO el marcador de ubicación del usuario)
    // Con animación
    await clearAllRoutes();
    await clearAllBuses();
    // Limpiar cache de buses visibles en el mapa
    busesOnMapRef.current.clear();
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
  }, [mapInstance]);

  const handleCompassMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!mapInstance.current) return;
      e.preventDefault();
      setIsDraggingCompass(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        bearing: mapInstance.current.getBearing(),
      });
    },
    [mapInstance],
  );

  const handleCompassTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!mapInstance.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      setIsDraggingCompass(true);
      setDragStart({
        x: touch.clientX,
        y: touch.clientY,
        bearing: mapInstance.current.getBearing(),
      });
    },
    [mapInstance],
  );

  const handleCompassMove = useCallback(
    (clientX: number) => {
      if (!mapInstance.current || !isDraggingCompass || !dragStart) return;

      const deltaX = clientX - dragStart.x;
      const newBearing = dragStart.bearing + deltaX;

      mapInstance.current.setBearing(newBearing);
      setMapBearing(newBearing);
    },
    [mapInstance, isDraggingCompass, dragStart, setMapBearing],
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

  // Manejar ruta que viene desde RoutesPage
  useIonViewWillEnter(() => {
    const routeData = (globalThis as { routeData?: RouteFromNavigation })
      .routeData;
    if (routeData) {
      setRouteFromNavigation(routeData);
      // Limpiar la data después de usarla
      delete (globalThis as { routeData?: RouteFromNavigation }).routeData;
    }

    // Manejar bus que viene desde BusesPage
    const busData = (globalThis as { busData?: BusFromNavigation }).busData;
    if (busData) {
      setBusFromNavigation(busData);
      // Limpiar la data después de usarla
      delete (globalThis as { busData?: BusFromNavigation }).busData;
    }
  });

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
        <MapContainer mapRef={mapRef} />

        {/* Indicador de carga del mapa */}
        {isMapLoading && <GlobalLoader />}

        {/* Indicador de estado offline */}
        {!isOnline && (
          <div
            className="fixed top-16 left-4 right-4 z-50 px-4 py-2 rounded-lg backdrop-blur-lg shadow-lg"
            style={{
              backgroundColor: 'rgba(var(--color-error-rgb), 0.9)',
              border: '1px solid rgba(var(--color-error-rgb), 0.5)',
              color: '#FFFFFF',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>⚠️</span>
              <span>
                Sin conexión a internet. Algunas funciones pueden estar
                limitadas.
              </span>
            </div>
          </div>
        )}

        <div className="fixed top-4 left-4 right-4 z-50" slot="fixed">
          <R2MSearchOverlay
            onItemSelect={handleItemSelect}
            onLayoutChange={triggerResize}
          />
        </div>

        <MapControls
          mapBearing={mapBearing}
          isDraggingCompass={isDraggingCompass}
          isClearingRoutes={isClearingRoutes}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetBearing={handleResetBearing}
          onLocationRequest={handleLocationRequest}
          onClearRoutes={handleClearRoutes}
          onCompassMouseDown={handleCompassMouseDown}
          onCompassTouchStart={handleCompassTouchStart}
        />

        <RouteHandler
          routeFromNavigation={routeFromNavigation}
          mapInstance={mapInstance}
          addRouteToMap={addRouteToMap}
          clearAllRoutes={clearAllRoutes}
          clearAllBuses={clearAllBuses}
          fitBoundsToRoute={fitBoundsToRoute}
          highlightRoute={highlightRoute}
          loadBusesForRoute={loadBusesForRoute}
          setIsMapLoading={setIsMapLoading}
          setSelectedItem={setSelectedItem}
          setRouteFromNavigation={setRouteFromNavigation}
          currentMarker={currentMarker}
        />

        <BusHandler
          busFromNavigation={busFromNavigation}
          mapInstance={mapInstance}
          addRouteToMap={addRouteToMap}
          clearAllRoutes={clearAllRoutes}
          clearAllBuses={clearAllBuses}
          fitBoundsToRoute={fitBoundsToRoute}
          loadBusesForRoute={loadBusesForRoute}
          setSelectedItem={setSelectedItem}
          setBusFromNavigation={setBusFromNavigation}
          currentMarker={currentMarker}
        />

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
      <R2MErrorToast error={error} onClose={clearError} />
    </IonPage>
  );
}
