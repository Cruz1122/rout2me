import { useEffect, useState } from 'react';
import { userLocationState } from '../data/userLocationMock';
import type { BusLocation } from '../services/busService';

/**
 * Hook reactivo para obtener la ubicación del usuario
 * Se actualiza automáticamente cuando la ubicación cambia
 */
export function useUserLocation(): BusLocation {
  const [location, setLocation] = useState<BusLocation>(
    userLocationState.get(),
  );

  useEffect(() => {
    // Suscribirse a cambios de ubicación
    const unsubscribe = userLocationState.subscribe(() => {
      setLocation(userLocationState.get());
    });

    // Cleanup: desuscribirse al desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  return location;
}
