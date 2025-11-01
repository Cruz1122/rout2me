import { useRef, useCallback, useEffect } from 'react';
import maplibregl, { type Map as MlMap } from 'maplibre-gl';

interface UserLocationMarkerOptions {
  autoUpdate?: boolean;
  updateInterval?: number;
  enabled?: boolean;
}

/**
 * Hook robusto para gestionar el marcador de ubicación del usuario
 * Previene el problema de marcador en esquina superior izquierda
 */
export function useUserLocationMarker(
  mapInstance: React.RefObject<MlMap | null>,
  options: UserLocationMarkerOptions = {},
) {
  const { autoUpdate = true, updateInterval = 10000, enabled = true } = options;

  const markerRef = useRef<maplibregl.Marker | null>(null);
  const lastValidPosition = useRef<{ lng: number; lat: number } | null>(null);

  /**
   * Valida coordenadas ESTRICTAMENTE
   */
  const isValidCoordinates = (lng: number, lat: number): boolean => {
    if (typeof lng !== 'number' || typeof lat !== 'number') return false;
    if (Number.isNaN(lng) || Number.isNaN(lat)) return false;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
    if (lng === 0 && lat === 0) return false; // Coordenadas [0,0] no son válidas
    if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return false;
    return true;
  };

  /**
   * Crea el marcador de ubicación del usuario
   * SOLO se llama cuando las coordenadas son 100% válidas
   */
  const createMarker = useCallback(
    (lng: number, lat: number) => {
      if (!mapInstance.current) {
        console.warn('⚠️ Mapa no disponible');
        return null;
      }

      // Crear elemento con estilos inline para evitar problemas CSS
      const el = document.createElement('div');
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #1E56A0;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(30, 86, 160, 0.7);
        cursor: pointer;
        animation: pulse-marker 2s infinite;
        z-index: 1000;
        pointer-events: auto;
        position: absolute;
      `;
      el.className = 'user-location-marker-v2';

      console.log('🎯 Creando marcador en coordenadas:', { lng, lat });

      // Crear marcador con configuración específica para evitar problemas de posicionamiento
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center', // Crítico: anclar al centro
        offset: [0, 0], // Sin offset
      });

      // PRIMERO establecer coordenadas, LUEGO agregar al mapa
      marker.setLngLat([lng, lat]);
      marker.addTo(mapInstance.current);

      console.log('✅ Marcador creado y agregado al mapa');

      return marker;
    },
    [mapInstance],
  );

  /**
   * Actualiza o crea el marcador con coordenadas válidas
   */
  const updateMarkerPosition = useCallback(
    (longitude: number, latitude: number): boolean => {
      // Validación estricta
      if (!isValidCoordinates(longitude, latitude)) {
        console.error('❌ Coordenadas rechazadas:', { longitude, latitude });
        return false;
      }

      if (!mapInstance.current) {
        console.warn('⚠️ Mapa no disponible');
        return false;
      }

      console.log('✅ Actualizando marcador:', { longitude, latitude });

      // Guardar posición válida
      lastValidPosition.current = { lng: longitude, lat: latitude };

      try {
        if (markerRef.current) {
          // Marcador existe: actualizar posición
          markerRef.current.setLngLat([longitude, latitude]);
        } else {
          // Crear nuevo marcador
          markerRef.current = createMarker(longitude, latitude);
        }

        return true;
      } catch (error) {
        console.error('❌ Error al actualizar marcador:', error);
        // En caso de error, eliminar marcador corrupto
        if (markerRef.current) {
          try {
            markerRef.current.remove();
          } catch {}
          markerRef.current = null;
        }
        return false;
      }
    },
    [mapInstance, createMarker],
  );

  /**
   * Obtiene ubicación actual y actualiza marcador
   */
  const getCurrentLocation = useCallback(
    (
      onSuccess?: (coords: GeolocationCoordinates) => void,
      onError?: (error: GeolocationPositionError) => void,
    ) => {
      if (!navigator.geolocation) {
        console.warn('❌ Geolocalización no disponible');
        onError?.(null as unknown as GeolocationPositionError);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const success = updateMarkerPosition(longitude, latitude);

          if (success) {
            onSuccess?.(position.coords);
          }
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error.message);
          onError?.(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    },
    [updateMarkerPosition],
  );

  /**
   * Centra el mapa en la ubicación del usuario
   */
  const centerOnUserLocation = useCallback(
    (zoom: number = 16) => {
      if (!mapInstance.current) return;

      // Si tenemos posición guardada, usar esa
      if (lastValidPosition.current) {
        const { lng, lat } = lastValidPosition.current;
        mapInstance.current.easeTo({
          center: [lng, lat],
          zoom,
          duration: 800,
        });
        return;
      }

      // Si no, obtener nueva ubicación
      getCurrentLocation((coords) => {
        if (mapInstance.current) {
          mapInstance.current.easeTo({
            center: [coords.longitude, coords.latitude],
            zoom,
            duration: 800,
          });
        }
      });
    },
    [mapInstance, getCurrentLocation],
  );

  /**
   * Elimina el marcador
   */
  const removeMarker = useCallback(() => {
    if (markerRef.current) {
      try {
        markerRef.current.remove();
      } catch (error) {
        console.error('Error eliminando marcador:', error);
      }
      markerRef.current = null;
      lastValidPosition.current = null;
    }
  }, []);

  // Auto-actualización
  useEffect(() => {
    if (!autoUpdate || !enabled || !mapInstance.current) return;

    console.log(`🔄 Auto-actualización activada (cada ${updateInterval}ms)`);

    // Actualización inmediata
    getCurrentLocation();

    // Intervalo de actualización
    const intervalId = setInterval(() => {
      getCurrentLocation();
    }, updateInterval);

    return () => {
      clearInterval(intervalId);
      console.log('🛑 Auto-actualización desactivada');
    };
  }, [autoUpdate, enabled, updateInterval, getCurrentLocation, mapInstance]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      removeMarker();
    };
  }, [removeMarker]);

  return {
    updateMarkerPosition,
    getCurrentLocation,
    centerOnUserLocation,
    removeMarker,
    hasMarker: () => markerRef.current !== null,
    getLastValidPosition: () => lastValidPosition.current,
  };
}
