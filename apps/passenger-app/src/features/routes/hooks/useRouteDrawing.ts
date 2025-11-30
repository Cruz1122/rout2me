import { useRef, useCallback } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import type { Stop } from '../services/routeService';
import {
  createStopMarkerElement,
  createEndpointMarkerElement,
} from '../utils/markerUtils';

// Helper para obtener colores de rutas desde CSS variables
const getRouteColor = (variable: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
};

export interface RouteDrawingOptions {
  color?: string;
  width?: number;
  opacity?: number;
  outlineColor?: string;
  outlineWidth?: number;
  stopColor?: string;
  stopOpacity?: number;
  endpointColor?: string;
  showShadow?: boolean;
}

export interface RouteDrawingCallbacks {
  onStopClick?: (stop: Stop, routeId: string) => void;
  onEndpointClick?: (
    type: 'start' | 'end',
    coordinates: [number, number],
    routeId: string,
  ) => void;
}

import {
  getOptimizedAnimationDuration,
  isMobileDevice,
} from '../../../utils/deviceDetection';

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

    // Animar opacidad a 0 usando transform para mejor rendimiento
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

export function useRouteDrawing(
  mapInstance: React.RefObject<MlMap | null>,
  callbacks?: RouteDrawingCallbacks,
) {
  const routeSources = useRef<Set<string>>(new Set());
  const routeLayers = useRef<Set<string>>(new Set());
  const stopMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const isClearingRef = useRef<boolean>(false);

  const removeStopsFromMap = useCallback(
    async (routeId: string) => {
      if (!mapInstance.current) return;

      // Buscar marcadores de paradas para esta ruta
      const markersToRemove: Array<{ id: string; marker: maplibregl.Marker }> =
        [];

      for (const [markerId, marker] of stopMarkers.current) {
        if (markerId.startsWith(`stop-${routeId}-`)) {
          markersToRemove.push({ id: markerId, marker });
        }
      }

      // Animar fade-out de todos los marcadores
      const fadeOutPromises = markersToRemove.map(({ marker }) =>
        fadeOutMarker(marker),
      );
      await Promise.all(fadeOutPromises);

      // Remover marcadores después de la animación
      for (const { id, marker } of markersToRemove) {
        marker.remove();
        stopMarkers.current.delete(id);
      }
    },
    [mapInstance],
  );

  const removeRouteFromMap = useCallback(
    async (routeId: string) => {
      if (!mapInstance.current) return;

      const layersToRemove = [
        `route-shadow-${routeId}`,
        `route-outline-${routeId}`,
        `route-main-${routeId}`,
        `route-glow-${routeId}`,
      ];

      const sourcesToRemove = [`route-${routeId}`];

      // Animar fade-out de las capas
      for (const layerId of layersToRemove) {
        if (mapInstance.current.getLayer(layerId)) {
          // Animar opacidad a 0 usando setPaintProperty con transición
          try {
            mapInstance.current.setPaintProperty(layerId, 'line-opacity', 0);
          } catch {
            // Si falla, continuar sin animación
          }
        }
      }

      // Animar fade-out de marcadores de inicio y fin
      const mapWithMarkers = mapInstance.current as MlMap & {
        _routeMarkers?: Record<string, maplibregl.Marker>;
      };
      const markers = mapWithMarkers._routeMarkers;
      const endpointFadeOutPromises: Promise<void>[] = [];

      if (markers) {
        if (
          markers[`start-${routeId}`] &&
          typeof markers[`start-${routeId}`].remove === 'function'
        ) {
          endpointFadeOutPromises.push(
            fadeOutMarker(markers[`start-${routeId}`]),
          );
        }
        if (
          markers[`end-${routeId}`] &&
          typeof markers[`end-${routeId}`].remove === 'function'
        ) {
          endpointFadeOutPromises.push(
            fadeOutMarker(markers[`end-${routeId}`]),
          );
        }
      }

      // Animar fade-out de paradas
      await removeStopsFromMap(routeId);

      // Esperar a que terminen todas las animaciones
      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, FADE_OUT_DURATION)),
        ...endpointFadeOutPromises,
      ]);

      // Remover capas después de la animación
      for (const layerId of layersToRemove) {
        if (mapInstance.current.getLayer(layerId)) {
          mapInstance.current.removeLayer(layerId);
          routeLayers.current.delete(layerId);
        }
      }

      // Remover fuentes
      for (const sourceId of sourcesToRemove) {
        if (mapInstance.current.getSource(sourceId)) {
          mapInstance.current.removeSource(sourceId);
          routeSources.current.delete(sourceId);
        }
      }

      // Remover marcadores de inicio y fin después de la animación
      if (markers) {
        // Capturar referencias antes de eliminar para evitar problemas de sincronización
        const startMarker = markers[`start-${routeId}`];
        const endMarker = markers[`end-${routeId}`];

        if (startMarker) {
          try {
            // Intentar remover el marcador directamente
            startMarker.remove();
          } catch {
            // Si falla, intentar verificar si el elemento existe y forzar eliminación
            try {
              const element = startMarker.getElement();
              if (element) {
                // Si el elemento existe pero remove() falló, intentar remover del DOM directamente
                element.remove();
              }
            } catch {
              // Ignorar errores si el marcador ya fue eliminado
            }
          }
          // Eliminar de la referencia incluso si falló la eliminación física
          delete markers[`start-${routeId}`];
        }

        if (endMarker) {
          try {
            // Intentar remover el marcador directamente
            endMarker.remove();
          } catch {
            // Si falla, intentar verificar si el elemento existe y forzar eliminación
            try {
              const element = endMarker.getElement();
              if (element) {
                // Si el elemento existe pero remove() falló, intentar remover del DOM directamente
                element.remove();
              }
            } catch {
              // Ignorar errores si el marcador ya fue eliminado
            }
          }
          // Eliminar de la referencia incluso si falló la eliminación física
          delete markers[`end-${routeId}`];
        }
      }
    },
    [mapInstance, removeStopsFromMap],
  );

  const addRouteEndpoints = useCallback(
    (
      routeId: string,
      coordinates: [number, number][],
      markerColor?: string,
    ) => {
      if (!mapInstance.current || coordinates.length < 2) return;

      const startPoint = coordinates[0];
      const endPoint = coordinates.at(-1)!;

      // Crear marcadores personalizados para origen y destino
      const startMarkerElement = createEndpointMarkerElement({
        type: 'start',
        color: markerColor,
        opacity: 0, // Iniciar con opacidad 0 para fade-in
      });

      const endMarkerElement = createEndpointMarkerElement({
        type: 'end',
        color: markerColor,
        opacity: 0, // Iniciar con opacidad 0 para fade-in
      });

      // Agregar event listeners para clics en los marcadores
      startMarkerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (callbacks?.onEndpointClick) {
          callbacks.onEndpointClick('start', startPoint, routeId);
        }
      });

      endMarkerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (callbacks?.onEndpointClick) {
          callbacks.onEndpointClick('end', endPoint, routeId);
        }
      });

      // Punto de inicio - Marcador personalizado
      const startMarker = new maplibregl.Marker({
        element: startMarkerElement,
        anchor: 'center',
      })
        .setLngLat(startPoint)
        .addTo(mapInstance.current);

      // Punto de fin - Marcador personalizado
      const endMarker = new maplibregl.Marker({
        element: endMarkerElement,
        anchor: 'center',
      })
        .setLngLat(endPoint)
        .addTo(mapInstance.current);

      // Guardar referencias para limpieza posterior
      routeSources.current.add(`marker-start-${routeId}`);
      routeSources.current.add(`marker-end-${routeId}`);

      // Almacenar referencias de marcadores para limpieza
      const mapWithMarkers = mapInstance.current as MlMap & {
        _routeMarkers?: Record<string, maplibregl.Marker>;
      };
      mapWithMarkers._routeMarkers = mapWithMarkers._routeMarkers || {};
      mapWithMarkers._routeMarkers[`start-${routeId}`] = startMarker;
      mapWithMarkers._routeMarkers[`end-${routeId}`] = endMarker;

      // Animar fade-in de los marcadores
      fadeInMarker(startMarker);
      fadeInMarker(endMarker);
    },
    [mapInstance, callbacks],
  );

  const addStopsToMap = useCallback(
    async (routeId: string, stops: Stop[], stopColor?: string) => {
      if (!mapInstance.current || !stops || stops.length === 0) return;

      // Limpiar paradas existentes para esta ruta (con animación)
      await removeStopsFromMap(routeId);

      for (const stop of stops) {
        const markerId = `stop-${routeId}-${stop.id}`;

        // Crear marcador personalizado para parada con opacidad inicial 0
        // Usar colores del tema actual
        const markerElement = createStopMarkerElement({
          color: stopColor || getRouteColor('--color-route-stop', '#FF6B35'),
          opacity: 0, // Iniciar con opacidad 0 para fade-in
          highlight: false,
        });

        // Agregar event listener para clic en el marcador
        markerElement.addEventListener('click', (e) => {
          e.stopPropagation();
          if (callbacks?.onStopClick) {
            callbacks.onStopClick(stop, routeId);
          }
        });

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center',
        })
          .setLngLat(stop.location)
          .addTo(mapInstance.current);

        // Guardar referencia del marcador
        stopMarkers.current.set(markerId, marker);

        // Animar fade-in del marcador
        fadeInMarker(marker);
      }
    },
    [mapInstance, removeStopsFromMap, callbacks],
  );

  const addRouteToMap = useCallback(
    async (
      routeId: string,
      coordinates: [number, number][],
      options: RouteDrawingOptions = {},
      stops?: Stop[],
    ) => {
      if (!mapInstance.current || !coordinates || coordinates.length === 0) {
        return;
      }

      const {
        color = getRouteColor('--color-route-default', '#1E56A0'),
        width = 6,
        opacity = 0.9,
        outlineColor = getRouteColor('--color-route-outline', '#ffffff'),
        outlineWidth = 10,
        stopColor,
        endpointColor,
        showShadow = true,
      } = options;

      const sourceId = `route-${routeId}`;
      const shadowLayerId = `route-shadow-${routeId}`;
      const outlineLayerId = `route-outline-${routeId}`;
      const mainLayerId = `route-main-${routeId}`;
      const glowLayerId = `route-glow-${routeId}`;

      // PRIMERO: Limpiar TODOS los marcadores y rutas existentes antes de agregar la nueva
      // Esto asegura que no queden marcadores huérfanos de rutas anteriores
      // Limpiar todas las capas y fuentes existentes
      const existingSources = Array.from(routeSources.current);
      const existingLayers = Array.from(routeLayers.current);

      // Remover todas las capas
      for (const layerId of existingLayers) {
        if (mapInstance.current.getLayer(layerId)) {
          try {
            mapInstance.current.removeLayer(layerId);
          } catch {
            // Ignorar errores
          }
        }
      }

      // Remover todas las fuentes
      for (const sourceId of existingSources) {
        if (mapInstance.current.getSource(sourceId)) {
          try {
            mapInstance.current.removeSource(sourceId);
          } catch {
            // Ignorar errores
          }
        }
      }

      // Limpiar TODOS los marcadores de inicio/fin
      const mapWithMarkers = mapInstance.current as MlMap & {
        _routeMarkers?: Record<string, maplibregl.Marker>;
      };
      if (mapWithMarkers._routeMarkers) {
        for (const markerId in mapWithMarkers._routeMarkers) {
          const marker = mapWithMarkers._routeMarkers[markerId];
          if (marker) {
            try {
              marker.remove();
            } catch {
              // Ignorar errores
            }
          }
        }
        mapWithMarkers._routeMarkers = {};
      }

      // Limpiar TODOS los marcadores de paradas
      for (const [, marker] of stopMarkers.current) {
        try {
          marker.remove();
        } catch {
          // Ignorar errores
        }
      }
      stopMarkers.current.clear();

      // Limpiar referencias
      routeSources.current.clear();
      routeLayers.current.clear();

      // Verificar que el mapa todavía existe después de la limpieza
      if (!mapInstance.current) {
        return;
      }

      // Agregar fuente de datos GeoJSON
      mapInstance.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            routeId,
            color,
            width,
            opacity,
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      });

      // Agregar capa de sombra (efecto Google Maps) - PRIMERA CAPA
      // Iniciar con opacidad 0 para fade-in
      if (showShadow) {
        mapInstance.current.addLayer({
          id: shadowLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#000000',
            'line-width': outlineWidth + 2,
            'line-opacity': 0, // Iniciar con opacidad 0
            'line-translate': [2, 2],
          },
        });
      }

      // Agregar capa de contorno (más gruesa, color diferente) - SEGUNDA CAPA
      // Iniciar con opacidad 0 para fade-in
      mapInstance.current.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': outlineColor,
          'line-width': outlineWidth,
          'line-opacity': 0, // Iniciar con opacidad 0
        },
      });

      // Agregar capa principal de la ruta - TERCERA CAPA (MÁS ARRIBA)
      // Iniciar con opacidad 0 para fade-in
      mapInstance.current.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': 0, // Iniciar con opacidad 0
        },
      });

      // Agregar capa de brillo (efecto Google Maps) - CUARTA CAPA (MÁS ARRIBA)
      // Iniciar con opacidad 0 para fade-in
      mapInstance.current.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width + 2,
          'line-opacity': 0, // Iniciar con opacidad 0
          'line-blur': 3,
        },
      });

      // Animar fade-in de las capas después de un pequeño delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (showShadow && mapInstance.current?.getLayer(shadowLayerId)) {
            mapInstance.current.setPaintProperty(
              shadowLayerId,
              'line-opacity',
              0.3,
            );
          }
          if (mapInstance.current?.getLayer(outlineLayerId)) {
            mapInstance.current.setPaintProperty(
              outlineLayerId,
              'line-opacity',
              1,
            );
          }
          if (mapInstance.current?.getLayer(mainLayerId)) {
            mapInstance.current.setPaintProperty(
              mainLayerId,
              'line-opacity',
              opacity,
            );
          }
          if (mapInstance.current?.getLayer(glowLayerId)) {
            mapInstance.current.setPaintProperty(
              glowLayerId,
              'line-opacity',
              opacity * 0.33,
            );
          }
        });
      });

      // Agregar puntos de inicio y fin
      addRouteEndpoints(
        routeId,
        coordinates,
        endpointColor || getRouteColor('--color-route-endpoint', '#1E56A0'),
      );

      // Agregar paradas si están disponibles (con animación)
      if (stops && stops.length > 0) {
        await addStopsToMap(routeId, stops, stopColor);
      }

      routeSources.current.add(sourceId);
      if (showShadow) {
        routeLayers.current.add(shadowLayerId);
      }
      routeLayers.current.add(outlineLayerId);
      routeLayers.current.add(mainLayerId);
      routeLayers.current.add(glowLayerId);
    },
    [mapInstance, addRouteEndpoints, addStopsToMap],
  );

  const clearAllRoutes = useCallback(async () => {
    if (!mapInstance.current) return;

    // Si ya hay una limpieza en curso, cancelarla y forzar eliminación inmediata
    if (isClearingRef.current) {
      // Forzar eliminación inmediata de todos los marcadores
      const mapWithMarkers = mapInstance.current as MlMap & {
        _routeMarkers?: Record<string, maplibregl.Marker>;
      };
      const markers = mapWithMarkers._routeMarkers;

      // Remover todos los marcadores de inicio/fin inmediatamente
      if (markers) {
        for (const markerId in markers) {
          if (markers[markerId]) {
            try {
              const element = markers[markerId].getElement();
              if (element) {
                element.style.transition = 'none';
                element.style.opacity = '0';
              }
              markers[markerId].remove();
            } catch {
              // Ignorar errores
            }
          }
        }
        mapWithMarkers._routeMarkers = {};
      }

      // Remover todos los marcadores de paradas inmediatamente
      for (const [, marker] of stopMarkers.current) {
        try {
          const element = marker.getElement();
          if (element) {
            element.style.transition = 'none';
            element.style.opacity = '0';
          }
          marker.remove();
        } catch {
          // Ignorar errores
        }
      }
      stopMarkers.current.clear();
    }

    // Marcar que estamos limpiando
    isClearingRef.current = true;

    try {
      const sourcesToRemove = Array.from(routeSources.current);
      const layersToRemove = Array.from(routeLayers.current);

      // Animar fade-out de todas las capas
      for (const layerId of layersToRemove) {
        if (mapInstance.current.getLayer(layerId)) {
          try {
            mapInstance.current.setPaintProperty(layerId, 'line-opacity', 0);
          } catch {
            // Si falla, continuar sin animación
          }
        }
      }

      // Animar fade-out de todos los marcadores de rutas
      const mapWithMarkers = mapInstance.current as MlMap & {
        _routeMarkers?: Record<string, maplibregl.Marker>;
      };
      const markers = mapWithMarkers._routeMarkers;

      // Capturar todos los marcadores ANTES de las animaciones para asegurar que se eliminen todos
      const endpointMarkersToRemove: Array<{
        markerId: string;
        marker: maplibregl.Marker;
      }> = [];

      if (markers) {
        for (const markerId in markers) {
          if (markers[markerId]) {
            endpointMarkersToRemove.push({
              markerId,
              marker: markers[markerId],
            });
          }
        }
      }

      const endpointFadeOutPromises: Promise<void>[] = [];
      for (const { marker } of endpointMarkersToRemove) {
        if (typeof marker.remove === 'function') {
          try {
            endpointFadeOutPromises.push(fadeOutMarker(marker));
          } catch {
            // Si falla la animación, continuar
          }
        }
      }

      // Animar fade-out de todos los marcadores de paradas
      const stopFadeOutPromises: Promise<void>[] = [];
      const stopMarkersToRemove = Array.from(stopMarkers.current.values());
      for (const marker of stopMarkersToRemove) {
        try {
          stopFadeOutPromises.push(fadeOutMarker(marker));
        } catch {
          // Si falla la animación, continuar
        }
      }

      // Esperar a que terminen todas las animaciones (con timeout de seguridad)
      await Promise.race([
        Promise.all([
          new Promise((resolve) => setTimeout(resolve, FADE_OUT_DURATION)),
          ...endpointFadeOutPromises,
          ...stopFadeOutPromises,
        ]),
        new Promise((resolve) => setTimeout(resolve, FADE_OUT_DURATION * 2)),
      ]);

      // Remover todas las capas después de la animación
      for (const layerId of layersToRemove) {
        if (mapInstance.current?.getLayer(layerId)) {
          try {
            mapInstance.current.removeLayer(layerId);
          } catch {
            // Ignorar errores si la capa ya no existe
          }
        }
      }

      // Remover todas las fuentes
      for (const sourceId of sourcesToRemove) {
        if (mapInstance.current?.getSource(sourceId)) {
          try {
            mapInstance.current.removeSource(sourceId);
          } catch {
            // Ignorar errores si la fuente ya no existe
          }
        }
      }

      // Remover todos los marcadores de inicio/fin después de la animación
      // Usar la lista capturada para asegurar que se eliminen todos
      for (const { markerId, marker } of endpointMarkersToRemove) {
        try {
          // Intentar remover el marcador directamente
          // No verificar parentElement porque puede estar en proceso de eliminación
          marker.remove();
        } catch {
          // Si falla, intentar verificar si el elemento existe y forzar eliminación
          try {
            const element = marker.getElement();
            if (element) {
              // Si el elemento existe pero remove() falló, intentar remover del DOM directamente
              element.remove();
            }
          } catch {
            // Ignorar errores si el marcador ya fue eliminado
          }
        }
        // Eliminar de la referencia incluso si falló la eliminación física
        if (markers && markers[markerId]) {
          delete markers[markerId];
        }
      }

      // Limpiar completamente el objeto de marcadores
      if (mapWithMarkers._routeMarkers) {
        mapWithMarkers._routeMarkers = {};
      }

      // Remover todos los marcadores de paradas después de la animación
      for (const marker of stopMarkersToRemove) {
        try {
          marker.remove();
        } catch {
          // Ignorar errores
        }
      }
      stopMarkers.current.clear();

      // Limpiar referencias
      routeSources.current.clear();
      routeLayers.current.clear();
    } finally {
      // Marcar que terminamos de limpiar
      isClearingRef.current = false;
    }
  }, [mapInstance]);

  const fitBoundsToRoute = useCallback(
    (coordinates: [number, number][], hasInfoCard: boolean = true) => {
      if (!mapInstance.current || coordinates.length === 0) return;

      const bounds = new maplibregl.LngLatBounds();
      for (const coord of coordinates) {
        bounds.extend(coord);
      }

      // Padding asimétrico para evitar que la card de información tape la ruta
      // La card está en bottom-20 (80px) y tiene aproximadamente 250px de altura
      // Usamos más padding en la parte inferior cuando hay card visible
      const padding = hasInfoCard
        ? {
            top: 50,
            bottom: 280, // 80px (posición) + 250px (altura card) - 50px (reducción de desplazamiento)
            left: 50,
            right: 50,
          }
        : {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          };

      // Configuración mejorada para evitar tiles faltantes
      mapInstance.current.fitBounds(bounds, {
        padding: padding,
        duration: 1500, // Animación más lenta para evitar tiles faltantes
        maxZoom: 18, // Limitar zoom máximo para evitar cargar tiles innecesarios
        essential: true, // Marcar como esencial para evitar interrupciones
      });

      // Precargar tiles después del cambio de vista
      setTimeout(() => {
        if (mapInstance.current) {
          // Forzar recarga de tiles si es necesario
          mapInstance.current.triggerRepaint();
        }
      }, 1600); // Después de que termine la animación
    },
    [mapInstance],
  );

  const highlightRoute = useCallback(
    (routeId: string, highlight: boolean = true) => {
      if (!mapInstance.current) return;

      const mainLayerId = `route-main-${routeId}`;
      const outlineLayerId = `route-outline-${routeId}`;

      if (mapInstance.current.getLayer(mainLayerId)) {
        mapInstance.current.setPaintProperty(
          mainLayerId,
          'line-width',
          highlight ? 6 : 4,
        );
        mapInstance.current.setPaintProperty(
          mainLayerId,
          'line-opacity',
          highlight ? 1 : 0.9,
        );
      }

      if (mapInstance.current.getLayer(outlineLayerId)) {
        mapInstance.current.setPaintProperty(
          outlineLayerId,
          'line-width',
          highlight ? 10 : 8,
        );
      }
    },
    [mapInstance],
  );

  // Función para verificar si una parada pertenece a una ruta actualmente graficada
  const getRouteIdForStop = useCallback((stopId: string): string | null => {
    // Buscar en los marcadores de paradas si existe uno con este stopId
    for (const [markerId] of stopMarkers.current) {
      if (markerId.endsWith(`-${stopId}`)) {
        // Extraer el routeId del markerId (formato: stop-{routeId}-{stopId})
        const parts = markerId.split('-');
        if (parts.length >= 3 && parts[0] === 'stop') {
          return parts.slice(1, -1).join('-'); // Unir todas las partes excepto 'stop' y el último (stopId)
        }
      }
    }
    return null;
  }, []);

  return {
    addRouteToMap,
    removeRouteFromMap,
    clearAllRoutes,
    fitBoundsToRoute,
    highlightRoute,
    addStopsToMap,
    removeStopsFromMap,
    getRouteIdForStop,
  };
}
