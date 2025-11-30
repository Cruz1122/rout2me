import { useEffect, useRef } from 'react';
import { supabase } from '../../../config/supabaseClient';
import { fetchBusById } from '../services/busService';
import type { Bus } from '../services/busService';
import { isAndroid } from '../../../shared/utils/platform';

export interface UseBusRealtimeOptions {
  /**
   * Callback que se ejecuta cuando un bus es actualizado
   */
  onBusUpdate?: (bus: Bus) => void;

  /**
   * Callback que se ejecuta cuando ocurre un error
   */
  onError?: (error: Error) => void;

  /**
   * Si es true, solo escucha cambios de buses activos (filtra buses offline)
   * Por defecto: false
   */
  onlyActiveBuses?: boolean;
}

/**
 * Hook para suscribirse a cambios en tiempo real de buses usando Supabase Realtime
 * Escucha cambios en las tablas: buses, vehicle_positions, driver_bus_assignments
 *
 * NOTA: Este hook NO usa debounce - procesa todos los cambios inmediatamente.
 * El debounce solo debe estar en componentes de conductores (ActiveBusMenuPage).
 */
export function useBusRealtime(options: UseBusRealtimeOptions = {}) {
  const { onBusUpdate, onError, onlyActiveBuses = false } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Cola para procesar actualizaciones en orden (sin debounce - procesa inmediatamente)
  const processingSetRef = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);

  // Usar refs para los callbacks para evitar recrear el canal cuando cambian
  const onBusUpdateRef = useRef(onBusUpdate);
  const onErrorRef = useRef(onError);
  const onlyActiveBusesRef = useRef(onlyActiveBuses);

  // Actualizar refs cuando cambian los callbacks
  useEffect(() => {
    onBusUpdateRef.current = onBusUpdate;
    onErrorRef.current = onError;
    onlyActiveBusesRef.current = onlyActiveBuses;
  }, [onBusUpdate, onError, onlyActiveBuses]);

  useEffect(() => {
    const processingSet = processingSetRef.current;
    const platform = isAndroid() ? 'Android' : 'Web';

    // Crear canal de Realtime con nombre único para evitar colisiones
    const channelName = `bus-realtime-${Date.now()}`;
    console.log(`[Realtime ${platform}] Creando canal: ${channelName}`);

    // Supabase maneja automáticamente el transporte (WebSocket en Android, mejor disponible en web)
    const channel = supabase
      .channel(channelName)
      // Suscribirse a cambios en la tabla buses (ocupación, status, etc.)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buses',
        },
        async (payload) => {
          try {
            console.log(
              `[Realtime ${platform}] Cambio en buses:`,
              payload.eventType,
            );

            // Extraer bus_id del payload
            const newRecord = payload.new as Record<string, unknown> | null;
            const oldRecord = payload.old as
              | Record<string, unknown>
              | undefined;

            const busId =
              (newRecord?.id as string) ||
              (newRecord?.bus_id as string) ||
              (oldRecord?.id as string) ||
              (oldRecord?.bus_id as string);

            if (!busId) {
              console.warn(
                `[Realtime ${platform}] No se pudo extraer bus_id del payload de buses`,
              );
              return;
            }

            // Procesar inmediatamente sin debounce (solo para pasajeros)
            // Evitar procesar el mismo bus simultáneamente
            if (processingSet.has(busId)) {
              console.log(
                `[Realtime ${platform}] Bus ${busId} ya está siendo procesado, ignorando duplicado`,
              );
              return;
            }

            processingSet.add(busId);
            try {
              await handleBusUpdate(busId);
            } finally {
              processingSet.delete(busId);
            }
          } catch (error) {
            console.error(
              `[Realtime ${platform}] Error procesando cambio en buses:`,
              error,
            );
            if (onErrorRef.current) {
              onErrorRef.current(
                error instanceof Error
                  ? error
                  : new Error('Error desconocido procesando cambio en buses'),
              );
            }
          }
        },
      )
      // Suscribirse a cambios en vehicle_positions (posición del bus)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_positions',
        },
        async (payload) => {
          try {
            console.log(`[Realtime ${platform}] Cambio en vehicle_positions`);

            // Extraer bus_id del payload
            const busId = (payload.new as { bus_id?: string })?.bus_id;

            if (!busId) {
              console.warn(
                `[Realtime ${platform}] No se pudo extraer bus_id del payload de vehicle_positions`,
              );
              return;
            }

            // Procesar inmediatamente sin debounce
            if (processingSet.has(busId)) {
              console.log(
                `[Realtime ${platform}] Bus ${busId} ya está siendo procesado, ignorando duplicado`,
              );
              return;
            }

            processingSet.add(busId);
            try {
              await handleBusUpdate(busId);
            } finally {
              processingSet.delete(busId);
            }
          } catch (error) {
            console.error(
              `[Realtime ${platform}] Error procesando cambio en vehicle_positions:`,
              error,
            );
            if (onErrorRef.current) {
              onErrorRef.current(
                error instanceof Error
                  ? error
                  : new Error(
                      'Error desconocido procesando cambio en vehicle_positions',
                    ),
              );
            }
          }
        },
      )
      // Suscribirse a cambios en driver_bus_assignments (qué bus está activo para cada driver)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_bus_assignments',
        },
        async (payload) => {
          try {
            console.log(
              `[Realtime ${platform}] Cambio en driver_bus_assignments`,
            );

            // Extraer bus_id del payload
            const busId = (payload.new as { bus_id?: string })?.bus_id;

            if (!busId) {
              console.warn(
                `[Realtime ${platform}] No se pudo extraer bus_id del payload de driver_bus_assignments`,
              );
              return;
            }

            // Procesar inmediatamente sin debounce
            if (processingSet.has(busId)) {
              console.log(
                `[Realtime ${platform}] Bus ${busId} ya está siendo procesado, ignorando duplicado`,
              );
              return;
            }

            processingSet.add(busId);
            try {
              await handleBusUpdate(busId);
            } finally {
              processingSet.delete(busId);
            }
          } catch (error) {
            console.error(
              `[Realtime ${platform}] Error procesando cambio en driver_bus_assignments:`,
              error,
            );
            if (onErrorRef.current) {
              onErrorRef.current(
                error instanceof Error
                  ? error
                  : new Error(
                      'Error desconocido procesando cambio en driver_bus_assignments',
                    ),
              );
            }
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0; // Resetear intentos de reconexión en suscripción exitosa
          console.log(
            `[Realtime ${platform}] ✅ Suscripción activa para buses`,
          );
          if (isAndroid()) {
            console.log(
              `[Realtime ${platform}] WebSocket conectado en Android`,
            );
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            `[Realtime ${platform}] ❌ Error en la suscripción Realtime`,
          );
          reconnectAttemptsRef.current++;

          // Intentar reconectar después de un delay
          if (reconnectAttemptsRef.current <= 5) {
            const delay = Math.min(reconnectAttemptsRef.current * 2000, 10000);
            console.log(
              `[Realtime ${platform}] Intentando reconectar en ${delay}ms (intento ${reconnectAttemptsRef.current}/5)`,
            );

            setTimeout(() => {
              if (channelRef.current) {
                console.log(`[Realtime ${platform}] Reconectando...`);
                channelRef.current.subscribe();
              }
            }, delay);
          } else {
            console.error(
              `[Realtime ${platform}] ❌ Máximo de intentos de reconexión alcanzado`,
            );
            if (onErrorRef.current) {
              onErrorRef.current(
                new Error(
                  'Error en la suscripción Realtime de buses - reconexión fallida',
                ),
              );
            }
          }
        } else if (status === 'TIMED_OUT') {
          console.warn(
            `[Realtime ${platform}] ⚠️ Timeout en suscripción Realtime`,
          );
        } else if (status === 'CLOSED') {
          console.warn(`[Realtime ${platform}] ⚠️ Canal cerrado`);
        }
      });

    channelRef.current = channel;

    // Función helper para manejar actualización de bus
    async function handleBusUpdate(busId: string) {
      const platform = isAndroid() ? 'Android' : 'Web';
      try {
        console.log(
          `[Realtime ${platform}] 🔄 Iniciando actualización del bus: ${busId}`,
        );
        const updatedBus = await fetchBusById(busId);

        if (!updatedBus) {
          console.warn(
            `[Realtime ${platform}] ⚠️ No se encontró el bus ${busId} después de la actualización`,
          );
          return;
        }

        console.log(`[Realtime ${platform}] ✅ Bus obtenido:`, {
          id: updatedBus.id,
          plate: updatedBus.plate,
          status: updatedBus.status,
          currentCapacity: updatedBus.currentCapacity,
          maxCapacity: updatedBus.maxCapacity,
        });

        // Si solo queremos buses activos, filtrar
        if (onlyActiveBusesRef.current && updatedBus.status === 'offline') {
          console.log(
            `[Realtime ${platform}] Bus ${busId} está offline, ignorando (onlyActiveBuses=true)`,
          );
          return;
        }

        // Invocar callback si existe (usar ref para obtener el callback más reciente)
        if (onBusUpdateRef.current) {
          console.log(
            `[Realtime ${platform}] 📢 Invocando callback onBusUpdate para bus ${busId}`,
          );
          onBusUpdateRef.current(updatedBus);
        } else {
          console.warn(
            `[Realtime ${platform}] ⚠️ No hay callback onBusUpdate definido para bus ${busId}`,
          );
        }
      } catch (error) {
        console.error(
          `[Realtime ${platform}] ❌ Error actualizando bus ${busId}:`,
          error,
        );
        if (onErrorRef.current) {
          onErrorRef.current(
            error instanceof Error
              ? error
              : new Error(`Error actualizando bus ${busId}`),
          );
        }
      }
    }

    // Cleanup: limpiar suscripción
    return () => {
      console.log(
        `[Realtime ${isAndroid() ? 'Android' : 'Web'}] 🧹 Limpiando suscripción`,
      );
      processingSet.clear();

      // Remover suscripción
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío: solo ejecutar una vez al montar
}
