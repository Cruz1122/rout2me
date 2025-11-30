import { useEffect, useRef } from 'react';
import { supabase } from '../../../config/supabaseClient';
import { fetchBusById } from '../services/busService';
import type { Bus } from '../services/busService';

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
 */
export function useBusRealtime(options: UseBusRealtimeOptions = {}) {
  const { onBusUpdate, onError, onlyActiveBuses = false } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const updateQueueRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    // Crear canal de Realtime
    const channel = supabase
      .channel('bus-realtime')
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
            console.log('Cambio en buses:', payload);
            console.log('Payload.new:', payload.new);
            console.log('Payload.old:', payload.old);

            // Extraer bus_id del payload
            // Intentar diferentes posibles nombres de campo
            const newRecord = payload.new as Record<string, unknown> | null;
            const oldRecord = payload.old as
              | Record<string, unknown>
              | undefined;

            const busId =
              (newRecord?.id as string) ||
              (newRecord?.bus_id as string) ||
              (oldRecord?.id as string) ||
              (oldRecord?.bus_id as string);

            console.log('[Realtime buses] Bus ID extraído:', busId);

            if (!busId) {
              console.warn(
                'No se pudo extraer bus_id del payload de buses. Payload completo:',
                JSON.stringify(payload, null, 2),
              );
              return;
            }

            // Debounce: cancelar actualización pendiente si existe
            const existingTimeout = updateQueueRef.current.get(busId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            // Programar actualización con debounce de 500ms
            const timeout = setTimeout(async () => {
              await handleBusUpdate(busId);
              updateQueueRef.current.delete(busId);
            }, 500);

            updateQueueRef.current.set(busId, timeout);
          } catch (error) {
            console.error('Error procesando cambio en buses:', error);
            if (onError) {
              onError(
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
            console.log('Cambio en vehicle_positions:', payload);

            // Extraer bus_id del payload
            const busId = (payload.new as { bus_id?: string })?.bus_id;

            if (!busId) {
              console.warn(
                'No se pudo extraer bus_id del payload de vehicle_positions',
              );
              return;
            }

            // Debounce: cancelar actualización pendiente si existe
            const existingTimeout = updateQueueRef.current.get(busId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            // Programar actualización con debounce de 500ms
            const timeout = setTimeout(async () => {
              await handleBusUpdate(busId);
              updateQueueRef.current.delete(busId);
            }, 500);

            updateQueueRef.current.set(busId, timeout);
          } catch (error) {
            console.error(
              'Error procesando cambio en vehicle_positions:',
              error,
            );
            if (onError) {
              onError(
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
            console.log('Cambio en driver_bus_assignments:', payload);

            // Extraer bus_id del payload
            const busId = (payload.new as { bus_id?: string })?.bus_id;

            if (!busId) {
              console.warn(
                'No se pudo extraer bus_id del payload de driver_bus_assignments',
              );
              return;
            }

            // Debounce: cancelar actualización pendiente si existe
            const existingTimeout = updateQueueRef.current.get(busId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            // Programar actualización con debounce de 500ms
            const timeout = setTimeout(async () => {
              await handleBusUpdate(busId);
              updateQueueRef.current.delete(busId);
            }, 500);

            updateQueueRef.current.set(busId, timeout);
          } catch (error) {
            console.error(
              'Error procesando cambio en driver_bus_assignments:',
              error,
            );
            if (onError) {
              onError(
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
          console.log('Suscripción Realtime activa para buses');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error en la suscripción Realtime de buses');
          if (onError) {
            onError(new Error('Error en la suscripción Realtime de buses'));
          }
        }
      });

    channelRef.current = channel;

    // Función helper para manejar actualización de bus
    async function handleBusUpdate(busId: string) {
      try {
        console.log(`[Realtime] Iniciando actualización del bus: ${busId}`);
        const updatedBus = await fetchBusById(busId);

        if (!updatedBus) {
          console.warn(
            `[Realtime] No se encontró el bus ${busId} después de la actualización`,
          );
          return;
        }

        console.log(`[Realtime] Bus obtenido exitosamente:`, {
          id: updatedBus.id,
          plate: updatedBus.plate,
          status: updatedBus.status,
        });

        // Si solo queremos buses activos, filtrar
        if (onlyActiveBuses && updatedBus.status === 'offline') {
          console.log(
            `[Realtime] Bus ${busId} está offline, ignorando (onlyActiveBuses=true)`,
          );
          return;
        }

        // Invocar callback si existe
        if (onBusUpdate) {
          console.log(
            `[Realtime] Invocando callback onBusUpdate para bus ${busId}`,
          );
          onBusUpdate(updatedBus);
        } else {
          console.warn(
            `[Realtime] No hay callback onBusUpdate definido para bus ${busId}`,
          );
        }
      } catch (error) {
        console.error(`[Realtime] Error actualizando bus ${busId}:`, error);
        if (onError) {
          onError(
            error instanceof Error
              ? error
              : new Error(`Error actualizando bus ${busId}`),
          );
        }
      }
    }

    // Cleanup: limpiar suscripción y timeouts pendientes
    return () => {
      // Limpiar todos los timeouts pendientes
      updateQueueRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      updateQueueRef.current.clear();

      // Remover suscripción
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [onBusUpdate, onError, onlyActiveBuses]);
}
