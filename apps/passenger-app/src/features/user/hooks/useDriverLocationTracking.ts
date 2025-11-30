import { useEffect, useRef } from 'react';
import { sendVehiclePosition } from '../services/driverService';
import { useActiveBus } from './useActiveBus';
import { useAuth } from '../../auth/hooks/useAuth';

interface UseDriverLocationTrackingOptions {
  /**
   * Intervalo en segundos para enviar la ubicación
   * @default 10
   */
  intervalSeconds?: number;
  /**
   * Callback cuando hay un error al enviar la ubicación
   */
  onError?: (error: Error) => void;
  /**
   * Si está deshabilitado, no enviará ubicaciones
   * @default false
   */
  disabled?: boolean;
}

/**
 * Hook que envía automáticamente la ubicación del conductor cuando hay un bus activo
 * Funciona en background independientemente de la vista actual
 */
export function useDriverLocationTracking(
  options: UseDriverLocationTrackingOptions = {},
) {
  const { activeBusId, hasActiveBus } = useActiveBus();
  const { accessToken } = useAuth();
  const { intervalSeconds = 10, onError, disabled = false } = options;

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Si está deshabilitado, no hacer nada
    if (disabled) {
      return;
    }

    // Si no hay bus activo o no hay token, no hacer nada
    if (!hasActiveBus || !activeBusId || !accessToken) {
      // Limpiar cualquier tracking activo
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Verificar que geolocation esté disponible
    if (!navigator.geolocation) {
      console.warn('Geolocation no está disponible');
      if (onError) {
        onError(
          new Error('Geolocation no está disponible en este dispositivo'),
        );
      }
      return;
    }

    console.log(
      `[useDriverLocationTracking] Iniciando tracking para bus ${activeBusId}`,
    );

    // Función para enviar la ubicación actual
    const sendLocation = async (location: { lat: number; lng: number }) => {
      if (!activeBusId || !accessToken) {
        return;
      }

      try {
        await sendVehiclePosition(accessToken, activeBusId, location, null);
        lastLocationRef.current = location;
        console.log(`[useDriverLocationTracking] Ubicación enviada:`, location);
      } catch (error) {
        console.error(
          '[useDriverLocationTracking] Error enviando ubicación:',
          error,
        );
        if (onError) {
          onError(
            error instanceof Error
              ? error
              : new Error('Error desconocido al enviar ubicación'),
          );
        }
      }
    };

    // Configurar watchPosition para obtener ubicaciones actualizadas
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Guardar la última ubicación
        const isFirstLocation = lastLocationRef.current === null;
        lastLocationRef.current = location;

        // Enviar inmediatamente la primera ubicación
        if (isFirstLocation) {
          sendLocation(location).catch((error) => {
            console.error(
              '[useDriverLocationTracking] Error en primera ubicación:',
              error,
            );
          });
        }
      },
      (error) => {
        console.error(
          '[useDriverLocationTracking] Error en watchPosition:',
          error,
        );
        if (onError) {
          let errorMessage = 'Error al obtener ubicación';
          if (error.code === 1) {
            errorMessage = 'Permiso de ubicación denegado';
          } else if (error.code === 2) {
            errorMessage = 'Ubicación no disponible';
          } else if (error.code === 3) {
            errorMessage = 'Tiempo de espera agotado';
          }
          onError(new Error(errorMessage));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );

    // Configurar intervalo para enviar ubicación periódicamente
    intervalRef.current = setInterval(() => {
      if (lastLocationRef.current && activeBusId && accessToken) {
        sendLocation(lastLocationRef.current).catch((error) => {
          console.error(
            '[useDriverLocationTracking] Error en envío periódico:',
            error,
          );
        });
      }
    }, intervalSeconds * 1000);

    // Cleanup: limpiar watch y intervalo
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log(
        `[useDriverLocationTracking] Tracking detenido para bus ${activeBusId}`,
      );
    };
  }, [
    activeBusId,
    hasActiveBus,
    accessToken,
    intervalSeconds,
    onError,
    disabled,
  ]);

  return {
    isTracking: hasActiveBus && !disabled && activeBusId !== null,
    activeBusId,
  };
}
