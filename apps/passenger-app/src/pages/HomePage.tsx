import { useEffect, useRef, useCallback, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter,
} from '@ionic/react';
import {
  RiFocus3Line,
  RiAddLine,
  RiSubtractLine,
  RiCompassLine,
} from 'react-icons/ri';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import R2MSearchOverlay from '../components/R2MSearchOverlay';
import R2MMapInfoCard from '../components/R2MMapInfoCard';
import { useMapResize } from '../hooks/useMapResize';
import type { SearchItem } from '../types/search';

export default function HomePage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const currentMarker = useRef<maplibregl.Marker | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [mapBearing, setMapBearing] = useState(0);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [shouldInitMap, setShouldInitMap] = useState(false);

  const { triggerResize } = useMapResize(mapInstance);

  const handleItemSelect = useCallback((item: SearchItem) => {
    if (!mapInstance.current) return;

    if (item.type === 'stop' && 'lat' in item && 'lng' in item) {
      if (currentMarker.current) {
        currentMarker.current.remove();
      }

      mapInstance.current.flyTo({
        center: [item.lng, item.lat],
        zoom: 17,
        duration: 1000,
      });

      currentMarker.current = new maplibregl.Marker({
        color: '#1E56A0',
      })
        .setLngLat([item.lng, item.lat])
        .addTo(mapInstance.current);

      setSelectedItem(item);
    }
  }, []);

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
            color: '#FF6B35',
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
      preserveDrawingBuffer: false, // Mejor rendimiento general
      refreshExpiredTiles: false, // No refrescar tiles automáticamente
      // Caché de tiles optimizado
      maxTileCacheSize: 100, // Aumentar caché para reusar tiles
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
        {isMapLoading && (
          <div
            className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          >
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto mb-4"
                style={{
                  borderTopColor: 'rgb(var(--color-primary-rgb))',
                }}
              />
              <p
                className="text-lg font-medium"
                style={{ color: 'rgb(var(--color-primary-rgb))' }}
              >
                Cargando mapa...
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Optimizado para tu conexión
              </p>
            </div>
          </div>
        )}

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
        </div>

        <R2MMapInfoCard
          selectedItem={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      </IonContent>
    </IonPage>
  );
}
