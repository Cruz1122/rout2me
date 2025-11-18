import { useEffect, useState } from 'react';
import type { BusLocation } from '../../routes/services/busService';

/**
 * Hook reactivo para obtener la ubicación real del usuario
 * Utiliza la API de Geolocation del navegador
 * REQUIERE permisos de geolocalización del usuario
 */
export function useUserLocation(): BusLocation | null {
  const [location, setLocation] = useState<BusLocation | null>(null);

  useEffect(() => {
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      console.warn('Geolocation no está disponible en este navegador');
      return;
    }

    console.log('Solicitando permisos de geolocalización...');

    // Configurar watch position para actualizaciones continuas desde el inicio
    let watchId: number | null = null;

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: BusLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log('Ubicación actualizada:', newLocation);
          setLocation(newLocation);
        },
        (err) => {
          console.error('Error en watch position:', err);

          // Mostrar mensaje según el tipo de error
          if (err.code === 1) {
            // PERMISSION_DENIED
            console.warn('Permiso de geolocalización denegado por el usuario');
            alert(
              'Para mostrar distancias precisas, necesitamos acceso a tu ubicación. Por favor, permite el acceso en la configuración de tu navegador.',
            );
          } else if (err.code === 2) {
            // POSITION_UNAVAILABLE
            console.warn('Ubicación no disponible');
            alert(
              'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.',
            );
          } else if (err.code === 3) {
            // TIMEOUT
            console.warn('Tiempo de espera agotado');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // 15 segundos para dar más tiempo
          maximumAge: 0, // No usar caché, siempre obtener ubicación fresca
        },
      );
    } catch (error) {
      console.error('Error al configurar watchPosition:', error);
    }

    // Cleanup: detener watch position
    return () => {
      if (watchId !== null && typeof watchId === 'number') {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch (error) {
          console.error('Error al limpiar watch:', error);
        }
      }
    };
  }, []);

  // Retornar null si no se ha obtenido ubicación
  return location;
}
