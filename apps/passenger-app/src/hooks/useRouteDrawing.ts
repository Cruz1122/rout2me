import { useRef, useCallback } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import type { Stop } from '../services/routeService';

export interface RouteDrawingOptions {
  color?: string;
  width?: number;
  opacity?: number;
  outlineColor?: string;
  outlineWidth?: number;
}

export function useRouteDrawing(mapInstance: React.RefObject<MlMap | null>) {
  const routeSources = useRef<Set<string>>(new Set());
  const routeLayers = useRef<Set<string>>(new Set());
  const stopMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());

  const removeStopsFromMap = useCallback(
    (routeId: string) => {
      if (!mapInstance.current) return;

      // Buscar y remover marcadores de paradas para esta ruta
      const markersToRemove: string[] = [];

      for (const [markerId, marker] of stopMarkers.current) {
        if (markerId.startsWith(`stop-${routeId}-`)) {
          marker.remove();
          markersToRemove.push(markerId);
        }
      }

      // Limpiar referencias
      for (const markerId of markersToRemove) {
        stopMarkers.current.delete(markerId);
      }
    },
    [mapInstance],
  );

  const removeRouteFromMap = useCallback(
    (routeId: string) => {
      if (!mapInstance.current) return;

      const layersToRemove = [
        `route-shadow-${routeId}`,
        `route-outline-${routeId}`,
        `route-main-${routeId}`,
        `route-glow-${routeId}`,
      ];

      const sourcesToRemove = [`route-${routeId}`];

      // Remover capas
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

      // Remover marcadores de inicio y fin
      const mapWithMarkers = mapInstance.current as MlMap & {
        _routeMarkers?: Record<string, maplibregl.Marker>;
      };
      const markers = mapWithMarkers._routeMarkers;
      if (markers) {
        if (
          markers[`start-${routeId}`] &&
          typeof markers[`start-${routeId}`].remove === 'function'
        ) {
          markers[`start-${routeId}`].remove();
          delete markers[`start-${routeId}`];
        }
        if (
          markers[`end-${routeId}`] &&
          typeof markers[`end-${routeId}`].remove === 'function'
        ) {
          markers[`end-${routeId}`].remove();
          delete markers[`end-${routeId}`];
        }
      }

      // Remover paradas de la ruta
      removeStopsFromMap(routeId);
    },
    [mapInstance, removeStopsFromMap],
  );

  const addRouteEndpoints = useCallback(
    (routeId: string, coordinates: [number, number][]) => {
      if (!mapInstance.current || coordinates.length < 2) return;

      const startPoint = coordinates[0];
      const endPoint = coordinates.at(-1)!;

      // Punto de inicio - Marcador azul estándar
      const startMarker = new maplibregl.Marker({
        color: '#1E56A0', // Color azul hardcodeado
        scale: 1.2,
      })
        .setLngLat(startPoint)
        .addTo(mapInstance.current);

      // Punto de fin - Marcador azul estándar
      const endMarker = new maplibregl.Marker({
        color: '#1E56A0', // Color azul hardcodeado
        scale: 1.2,
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
    },
    [mapInstance],
  );

  const addStopsToMap = useCallback(
    (routeId: string, stops: Stop[]) => {
      if (!mapInstance.current || !stops || stops.length === 0) return;

      // Limpiar paradas existentes para esta ruta
      removeStopsFromMap(routeId);

      for (const [index, stop] of stops.entries()) {
        const markerId = `stop-${routeId}-${stop.id}`;

        // Crear marcador personalizado para parada
        const marker = new maplibregl.Marker({
          color: '#FF6B35', // Color naranja para paradas
          scale: 0.8,
        })
          .setLngLat(stop.location)
          .addTo(mapInstance.current);

        // Agregar popup con información de la parada
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
        }).setHTML(`
            <div style="padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">
                ${stop.name}
              </div>
              <div style="font-size: 12px; color: #6B7280;">
                Parada ${index + 1}
              </div>
            </div>
          `);

        marker.setPopup(popup);

        // Guardar referencia del marcador
        stopMarkers.current.set(markerId, marker);
      }
    },
    [mapInstance, removeStopsFromMap],
  );

  const addRouteToMap = useCallback(
    (
      routeId: string,
      coordinates: [number, number][],
      options: RouteDrawingOptions = {},
      stops?: Stop[],
    ) => {
      if (!mapInstance.current || !coordinates || coordinates.length === 0) {
        return;
      }

      const { color = '#1E56A0', width = 6, opacity = 0.9 } = options;

      const sourceId = `route-${routeId}`;
      const shadowLayerId = `route-shadow-${routeId}`;
      const outlineLayerId = `route-outline-${routeId}`;
      const mainLayerId = `route-main-${routeId}`;
      const glowLayerId = `route-glow-${routeId}`;

      // Limpiar ruta existente si ya existe
      removeRouteFromMap(routeId);

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
          'line-width': 12, // outlineWidth + 2 hardcodeado
          'line-opacity': 0.3,
          'line-translate': [2, 2],
        },
      });

      // Agregar capa de contorno (más gruesa, color diferente) - SEGUNDA CAPA
      mapInstance.current.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff', // outlineColor hardcodeado
          'line-width': 10, // outlineWidth hardcodeado
          'line-opacity': 1,
        },
      });

      // Agregar capa principal de la ruta - TERCERA CAPA (MÁS ARRIBA)
      mapInstance.current.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#1E56A0', // color hardcodeado
          'line-width': 6, // width hardcodeado
          'line-opacity': 0.9, // opacity hardcodeado
        },
      });

      // Agregar capa de brillo (efecto Google Maps) - CUARTA CAPA (MÁS ARRIBA)
      mapInstance.current.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#1E56A0', // color hardcodeado
          'line-width': 8, // width + 2 hardcodeado
          'line-opacity': 0.3,
          'line-blur': 3,
        },
      });

      // Agregar puntos de inicio y fin
      addRouteEndpoints(routeId, coordinates);

      // Agregar paradas si están disponibles
      if (stops && stops.length > 0) {
        addStopsToMap(routeId, stops);
      }

      routeSources.current.add(sourceId);
      routeLayers.current.add(shadowLayerId);
      routeLayers.current.add(outlineLayerId);
      routeLayers.current.add(mainLayerId);
      routeLayers.current.add(glowLayerId);
    },
    [mapInstance, addRouteEndpoints, removeRouteFromMap, addStopsToMap],
  );

  const clearAllRoutes = useCallback(() => {
    if (!mapInstance.current) return;

    const sourcesToRemove = Array.from(routeSources.current);
    const layersToRemove = Array.from(routeLayers.current);

    // Remover todas las capas
    for (const layerId of layersToRemove) {
      if (mapInstance.current.getLayer(layerId)) {
        mapInstance.current.removeLayer(layerId);
      }
    }

    // Remover todas las fuentes
    for (const sourceId of sourcesToRemove) {
      if (mapInstance.current.getSource(sourceId)) {
        mapInstance.current.removeSource(sourceId);
      }
    }

    // Remover todos los marcadores de rutas
    const mapWithMarkers = mapInstance.current as MlMap & {
      _routeMarkers?: Record<string, maplibregl.Marker>;
    };
    const markers = mapWithMarkers._routeMarkers;
    if (markers) {
      for (const markerId in markers) {
        if (
          markers[markerId] &&
          typeof markers[markerId].remove === 'function'
        ) {
          markers[markerId].remove();
        }
      }
      mapWithMarkers._routeMarkers = {};
    }

    // Remover todos los marcadores de paradas
    for (const marker of stopMarkers.current.values()) {
      marker.remove();
    }
    stopMarkers.current.clear();

    // Limpiar referencias
    routeSources.current.clear();
    routeLayers.current.clear();
  }, [mapInstance]);

  const fitBoundsToRoute = useCallback(
    (coordinates: [number, number][]) => {
      if (!mapInstance.current || coordinates.length === 0) return;

      const bounds = new maplibregl.LngLatBounds();
      for (const coord of coordinates) {
        bounds.extend(coord);
      }

      // Configuración mejorada para evitar tiles faltantes
      mapInstance.current.fitBounds(bounds, {
        padding: 50,
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

  return {
    addRouteToMap,
    removeRouteFromMap,
    clearAllRoutes,
    fitBoundsToRoute,
    highlightRoute,
    addStopsToMap,
    removeStopsFromMap,
  };
}
