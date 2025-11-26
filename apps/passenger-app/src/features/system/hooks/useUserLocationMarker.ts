import { useRef, useCallback, useEffect } from 'react';
import maplibregl, { type Map as MlMap } from 'maplibre-gl';

interface UserLocationMarkerOptions {
  autoUpdate?: boolean;
  updateInterval?: number;
  enabled?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Hook robusto para gestionar el marcador de ubicación del usuario
 * Previene el problema de marcador en esquina superior izquierda
 */
export function useUserLocationMarker(
  mapInstance: React.RefObject<MlMap | null>,
  options: UserLocationMarkerOptions = {},
) {
  const {
    autoUpdate = true,
    updateInterval = 10000,
    enabled = true,
    theme = 'light',
  } = options;

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
        return null;
      }

      // Crear elemento con estilos inline para evitar problemas CSS
      const el = document.createElement('div');
      // En dark mode: marcador blanco con borde oscuro
      // En light mode: marcador azul con borde blanco
      const isDark = theme === 'dark';
      const backgroundColor = isDark ? '#FFFFFF' : '#1E56A0';
      const borderColor = isDark ? '#1E293B' : '#FFFFFF';
      const pulseColor = isDark
        ? 'rgba(255, 255, 255, 0.7)'
        : 'rgba(30, 86, 160, 0.7)';

      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${backgroundColor};
        border: 3px solid ${borderColor};
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3), 0 0 0 0 ${pulseColor};
        cursor: pointer;
        animation: pulse-marker 2s infinite;
        z-index: 1000;
        pointer-events: auto;
        position: absolute;
      `;
      el.className = 'user-location-marker-v2';

      // Crear marcador con configuración específica para evitar problemas de posicionamiento
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center', // Crítico: anclar al centro
        offset: [0, 0], // Sin offset
      });

      // PRIMERO establecer coordenadas, LUEGO agregar al mapa
      marker.setLngLat([lng, lat]);
      marker.addTo(mapInstance.current);

      return marker;
    },
    [mapInstance, theme],
  );

  /**
   * Actualiza o crea el marcador con coordenadas válidas
   */
  const updateMarkerPosition = useCallback(
    (longitude: number, latitude: number): boolean => {
      // Validación estricta
      if (!isValidCoordinates(longitude, latitude)) {
        return false;
      }

      if (!mapInstance.current) {
        return false;
      }

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
      } catch {
        // En caso de error, eliminar marcador corrupto
        if (markerRef.current) {
          try {
            markerRef.current.remove();
          } catch {
            // Ignorar errores al remover marcador
          }
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
      } catch {
        // Ignorar errores al remover marcador
      }
      markerRef.current = null;
      lastValidPosition.current = null;
    }
  }, []);

  // Auto-actualización y creación inicial del marcador
  useEffect(() => {
    if (!autoUpdate || !enabled) return;

    // Función para verificar si el mapa está listo e iniciar
    const initMarker = () => {
      if (mapInstance.current) {
        // Mapa está listo: crear marcador inmediatamente
        getCurrentLocation();

        // Configurar intervalo de actualización
        const intervalId = setInterval(() => {
          getCurrentLocation();
        }, updateInterval);

        return intervalId;
      }
      return null;
    };

    // Intentar iniciar inmediatamente
    let intervalId = initMarker();

    // Si el mapa no está listo, usar un timeout para reintentar
    if (!intervalId) {
      const timeoutId = setTimeout(() => {
        intervalId = initMarker();
      }, 500); // Reintentar después de 500ms

      return () => {
        clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
      };
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoUpdate, enabled, updateInterval, getCurrentLocation, mapInstance]);

  // Actualizar marcador cuando cambie el tema
  useEffect(() => {
    if (markerRef.current && lastValidPosition.current) {
      const { lng, lat } = lastValidPosition.current;
      // Remover marcador antiguo
      removeMarker();
      // Recrear con nuevo tema
      markerRef.current = createMarker(lng, lat);
    }
  }, [theme, createMarker, removeMarker]);

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
