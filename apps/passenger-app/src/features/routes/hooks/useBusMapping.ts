import { useRef, useCallback } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import { RiBus2Fill } from 'react-icons/ri';
import type { Bus } from '../services/busService';
import {
  getOptimizedAnimationDuration,
  isMobileDevice,
} from '../../../utils/deviceDetection';

export interface BusMappingCallbacks {
  onBusClick?: (bus: Bus) => void;
}

// Constantes de animación optimizadas para móvil
const BASE_FADE_DURATION = 300; // ms
const FADE_OUT_DURATION = isMobileDevice() ? 200 : BASE_FADE_DURATION;
const FADE_IN_DURATION = isMobileDevice() ? 200 : BASE_FADE_DURATION;

// Helper para animar fade-out de un marcador
const fadeOutMarker = (marker: maplibregl.Marker): Promise<void> => {
  return new Promise((resolve) => {
    const element = marker.getElement();
    if (!element) {
      resolve();
      return;
    }

    // Optimizar para GPU
    element.style.willChange = 'opacity';
    const duration = getOptimizedAnimationDuration(FADE_OUT_DURATION);

    // Animar opacidad a 0
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = '0';

    setTimeout(() => {
      element.style.willChange = 'auto';
      resolve();
    }, duration);
  });
};

// Helper para animar fade-in de un marcador
const fadeInMarker = (marker: maplibregl.Marker): void => {
  const element = marker.getElement();
  if (!element) return;

  // Optimizar para GPU
  element.style.willChange = 'opacity';
  const duration = getOptimizedAnimationDuration(FADE_IN_DURATION);

  // Asegurar que el elemento tenga opacidad 0 inicialmente
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ease-in-out`;

  // Usar requestAnimationFrame para asegurar que el cambio de opacidad se aplique
  // después de que el elemento esté en el DOM
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Verificar que el elemento todavía existe antes de animar
      if (element && element.parentElement) {
        element.style.opacity = '1';
        // Limpiar will-change después de la animación
        setTimeout(() => {
          if (element) {
            element.style.willChange = 'auto';
          }
        }, duration);
      }
    });
  });
};

/**
 * Obtiene el color basado en la ocupación del bus
 */
function getOccupancyColor(occupancy: Bus['occupancy']): string {
  switch (occupancy) {
    case 'low':
      return '#10B981'; // Verde
    case 'medium':
      return '#F59E0B'; // Amarillo
    case 'high':
      return '#EF4444'; // Rojo
    default:
      return '#9CA3AF'; // Gris
  }
}

/**
 * Crea un elemento HTML personalizado para marcadores de bus
 */
function createBusMarkerElement(
  bus: Bus,
  isHighlighted = false,
  initialOpacity = 1,
): HTMLElement {
  const element = document.createElement('div');

  // Aplicar opacidad al wrapper para facilitar las animaciones
  element.style.opacity = String(initialOpacity);
  element.style.transition = 'opacity 0.3s ease-in-out';

  // Usar color basado en ocupación, no en ubicación
  const occupancyColor = getOccupancyColor(bus.occupancy);

  // Detectar si estamos en dark mode
  const isDarkMode =
    document.documentElement.getAttribute('data-theme') === 'dark';

  // En light mode usar fondo blanco, en dark mode usar surface
  const backgroundColor = isDarkMode
    ? getComputedStyle(document.documentElement)
        .getPropertyValue('--color-surface')
        .trim() || '#D6E4F0'
    : '#FFFFFF';

  // Crear el contenedor del marcador
  const markerContainer = document.createElement('div');
  markerContainer.style.cssText = `
    background: ${backgroundColor};
    border: ${isHighlighted ? '4px' : '3px'} solid ${occupancyColor};
    border-radius: 50%;
    width: ${isHighlighted ? '32px' : '28px'};
    height: ${isHighlighted ? '32px' : '28px'};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${occupancyColor};
    box-shadow: ${isHighlighted ? `0 4px 12px ${occupancyColor}40` : '0 2px 8px rgba(0, 0, 0, 0.3)'};
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  `;

  // Agregar animación pulse si está destacado
  if (isHighlighted) {
    markerContainer.style.animation = 'pulse 2s infinite';
    // Crear keyframes para la animación pulse
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Crear el ícono de React Icons con color basado en ocupación
  const iconContainer = document.createElement('div');
  iconContainer.style.color = occupancyColor;
  const root = createRoot(iconContainer);
  root.render(RiBus2Fill({ size: 16, color: occupancyColor }));

  markerContainer.appendChild(iconContainer);

  // Agregar indicador de pulso para buses cercanos
  if (bus.status === 'nearby') {
    const pulseIndicator = document.createElement('div');
    pulseIndicator.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: #EF4444;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s infinite;
    `;
    markerContainer.appendChild(pulseIndicator);
  }

  // Agregar estilos CSS para la animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  element.appendChild(style);
  element.appendChild(markerContainer);

  // Agregar eventos de hover
  markerContainer.addEventListener('mouseenter', () => {
    markerContainer.style.transform = 'scale(1.2)';
  });

  markerContainer.addEventListener('mouseleave', () => {
    markerContainer.style.transform = 'scale(1)';
  });

  return element;
}

export function useBusMapping(
  mapInstance: React.RefObject<MlMap | null>,
  callbacks?: BusMappingCallbacks,
) {
  const busMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const highlightedBuses = useRef<Set<string>>(new Set());

  const removeBusFromMap = useCallback(
    async (busId: string) => {
      if (!mapInstance.current) return;

      const marker = busMarkers.current.get(busId);
      if (marker) {
        // Animar fade-out antes de remover
        await fadeOutMarker(marker);
        marker.remove();
        busMarkers.current.delete(busId);
      }
    },
    [mapInstance],
  );

  const removeBusesFromMap = useCallback(
    (busIds: string[]) => {
      if (!mapInstance.current) return;

      for (const busId of busIds) {
        removeBusFromMap(busId);
      }
    },
    [mapInstance, removeBusFromMap],
  );

  const clearAllBuses = useCallback(async () => {
    if (!mapInstance.current) return;

    // Animar fade-out de todos los marcadores
    const fadeOutPromises: Promise<void>[] = [];
    for (const marker of busMarkers.current.values()) {
      fadeOutPromises.push(fadeOutMarker(marker));
    }

    // Esperar a que terminen todas las animaciones
    await Promise.all(fadeOutPromises);

    // Remover marcadores después de la animación
    for (const marker of busMarkers.current.values()) {
      marker.remove();
    }
    busMarkers.current.clear();
    highlightedBuses.current.clear();
  }, [mapInstance]);

  const addBusToMap = useCallback(
    async (bus: Bus, isHighlighted = false) => {
      if (!mapInstance.current || !bus.location) return;

      // Remover marcador existente si ya existe (con animación)
      await removeBusFromMap(bus.id);

      // Crear marcador personalizado para el bus con opacidad inicial 0
      const markerElement = createBusMarkerElement(bus, isHighlighted, 0);

      // Agregar event listener para clic en el marcador
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (callbacks?.onBusClick) {
          callbacks.onBusClick(bus);
        }
      });

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([bus.location.longitude, bus.location.latitude])
        .addTo(mapInstance.current);

      // Guardar referencia del marcador
      busMarkers.current.set(bus.id, marker);

      // Guardar si está destacado
      if (isHighlighted) {
        highlightedBuses.current.add(bus.id);
      } else {
        highlightedBuses.current.delete(bus.id);
      }

      // Animar fade-in del marcador
      fadeInMarker(marker);
    },
    [mapInstance, removeBusFromMap, callbacks],
  );

  const addBusesToMap = useCallback(
    async (buses: Bus[], highlightedBusId?: string) => {
      if (!mapInstance.current) return;

      // Limpiar buses existentes (con animación)
      await clearAllBuses();

      // Agregar cada bus al mapa (con animación)
      for (const bus of buses) {
        if (bus.location && bus.status !== 'offline') {
          const isHighlighted = highlightedBusId === bus.id;
          await addBusToMap(bus, isHighlighted);
        }
      }
    },
    [mapInstance, clearAllBuses, addBusToMap],
  );

  const updateBusOnMap = useCallback(
    async (bus: Bus) => {
      if (!mapInstance.current || !bus.location) {
        // Si el bus no tiene ubicación o está offline, removerlo del mapa
        if (bus.status === 'offline' || !bus.location) {
          const marker = busMarkers.current.get(bus.id);
          if (marker) {
            await removeBusFromMap(bus.id);
          }
        }
        return;
      }

      const existingMarker = busMarkers.current.get(bus.id);
      if (existingMarker) {
        // Verificar si el bus está destacado
        const isHighlighted = highlightedBuses.current.has(bus.id);

        // Obtener la posición actual del marcador
        const currentLngLat = existingMarker.getLngLat();
        const newLngLat: [number, number] = [
          bus.location.longitude,
          bus.location.latitude,
        ];

        // Verificar si cambió la posición significativamente (umbral más pequeño para detectar movimientos)
        const lngDiff = Math.abs(currentLngLat.lng - newLngLat[0]);
        const latDiff = Math.abs(currentLngLat.lat - newLngLat[1]);
        const positionChanged = lngDiff > 0.00001 || latDiff > 0.00001; // Umbral más pequeño (aprox. 1 metro)

        console.log(`[useBusMapping] Comparando posición para bus ${bus.id}:`, {
          current: { lng: currentLngLat.lng, lat: currentLngLat.lat },
          new: { lng: newLngLat[0], lat: newLngLat[1] },
          diffs: { lng: lngDiff, lat: latDiff },
          positionChanged,
        });

        // Obtener el elemento actual para verificar si necesita actualización visual
        const currentElement = existingMarker.getElement();
        const currentContainer = currentElement.querySelector(
          'div',
        ) as HTMLElement;
        const currentBorder = currentContainer?.style.border || '';
        const occupancyColor = getOccupancyColor(bus.occupancy);
        const expectedBorder = `${isHighlighted ? '4px' : '3px'} solid ${occupancyColor}`;
        const needsVisualUpdate = currentBorder !== expectedBorder;

        // Si solo cambió la posición (no el visual), actualizar directamente (más eficiente)
        if (positionChanged && !needsVisualUpdate) {
          // Actualizar posición directamente sin recrear el marcador
          existingMarker.setLngLat(newLngLat);
          console.log(
            `[useBusMapping] Posición actualizada directamente para bus ${bus.id}:`,
            {
              oldPosition: { lng: currentLngLat.lng, lat: currentLngLat.lat },
              newPosition: { lng: newLngLat[0], lat: newLngLat[1] },
            },
          );
        }
        // Si cambió el visual (con o sin cambio de posición), recrear el marcador
        else if (needsVisualUpdate || positionChanged) {
          // Fade-out del marcador actual
          await fadeOutMarker(existingMarker);

          // Remover el marcador viejo
          existingMarker.remove();
          busMarkers.current.delete(bus.id);

          // Crear nuevo elemento con los datos actualizados (opacidad inicial 0)
          const newElement = createBusMarkerElement(bus, isHighlighted, 0);

          // Agregar event listener para clic en el marcador
          newElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (callbacks?.onBusClick) {
              callbacks.onBusClick(bus);
            }
          });

          // Crear nuevo marcador en la nueva posición
          const newMarker = new maplibregl.Marker({
            element: newElement,
            anchor: 'center',
          })
            .setLngLat(newLngLat)
            .addTo(mapInstance.current);

          // Guardar referencia del nuevo marcador
          busMarkers.current.set(bus.id, newMarker);

          // Pequeño delay para asegurar que el DOM se actualice
          await new Promise((resolve) => setTimeout(resolve, 50));

          // Fade-in del marcador actualizado
          fadeInMarker(newMarker);

          console.log(`[useBusMapping] Marcador recreado para bus ${bus.id}:`, {
            positionChanged,
            needsVisualUpdate,
            oldPosition: { lng: currentLngLat.lng, lat: currentLngLat.lat },
            newPosition: { lng: newLngLat[0], lat: newLngLat[1] },
            occupancy: bus.occupancy,
            status: bus.status,
            isHighlighted,
          });
        } else {
          console.log(
            `[useBusMapping] Marcador no necesita actualización para bus ${bus.id}`,
          );
        }
      } else {
        // Si no existe el marcador, crearlo
        console.log(
          `[useBusMapping] Marcador no existe, creando nuevo para bus ${bus.id}`,
        );
        await addBusToMap(bus, false);
      }
    },
    [mapInstance, addBusToMap, callbacks, removeBusFromMap],
  );

  return {
    addBusToMap,
    addBusesToMap,
    removeBusFromMap,
    removeBusesFromMap,
    clearAllBuses,
    updateBusOnMap,
  };
}
