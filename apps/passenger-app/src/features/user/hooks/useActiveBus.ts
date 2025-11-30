import { useState, useEffect, useCallback } from 'react';

const ACTIVE_BUS_STORAGE_KEY = 'driver_active_bus_id';

/**
 * Hook para manejar el estado del bus activo del conductor
 * Persiste el estado en localStorage para mantenerlo entre sesiones
 */
export function useActiveBus() {
  const [activeBusId, setActiveBusIdState] = useState<string | null>(null);

  // Cargar bus activo desde localStorage al montar
  useEffect(() => {
    const storedBusId = localStorage.getItem(ACTIVE_BUS_STORAGE_KEY);
    if (storedBusId) {
      setActiveBusIdState(storedBusId);
    }
  }, []);

  /**
   * Establece el bus activo y lo guarda en localStorage
   */
  const setActiveBus = useCallback((busId: string | null) => {
    if (busId) {
      localStorage.setItem(ACTIVE_BUS_STORAGE_KEY, busId);
      setActiveBusIdState(busId);
    } else {
      localStorage.removeItem(ACTIVE_BUS_STORAGE_KEY);
      setActiveBusIdState(null);
    }
  }, []);

  /**
   * Limpia el bus activo
   */
  const clearActiveBus = useCallback(() => {
    localStorage.removeItem(ACTIVE_BUS_STORAGE_KEY);
    setActiveBusIdState(null);
  }, []);

  /**
   * Verifica si un bus específico está activo
   */
  const isBusActive = useCallback(
    (busId: string) => {
      return activeBusId === busId;
    },
    [activeBusId],
  );

  /**
   * Verifica si hay algún bus activo
   */
  const hasActiveBus = activeBusId !== null;

  return {
    activeBusId,
    setActiveBus,
    clearActiveBus,
    isBusActive,
    hasActiveBus,
  };
}
