import { useRef, useCallback } from 'react';
import maplibregl, { Map as MlMap } from 'maplibre-gl';

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
        if (mapInstance.current!.getLayer(layerId)) {
          mapInstance.current!.removeLayer(layerId);
          routeLayers.current.delete(layerId);
        }
      }

      // Remover fuentes
      for (const sourceId of sourcesToRemove) {
        if (mapInstance.current!.getSource(sourceId)) {
          mapInstance.current!.removeSource(sourceId);
          routeSources.current.delete(sourceId);
        }
      }

      // Remover marcadores
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
    },
    [mapInstance],
  );

  const addRouteEndpoints = useCallback(
    (routeId: string, coordinates: [number, number][]) => {
      if (!mapInstance.current || coordinates.length < 2) return;

      const startPoint = coordinates[0];
      const endPoint = coordinates.at(-1)!;

      // Punto de inicio - Marcador azul estándar
      const startMarker = new maplibregl.Marker({
        color: 'var(--color-secondary)', // #1E56A0
        scale: 1.2,
      })
        .setLngLat(startPoint)
        .addTo(mapInstance.current);

      // Punto de fin - Marcador azul estándar
      const endMarker = new maplibregl.Marker({
        color: 'var(--color-secondary)', // #1E56A0
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

  const addRouteToMap = useCallback(
    (
      routeId: string,
      coordinates: [number, number][],
      options: RouteDrawingOptions = {},
    ) => {
      if (!mapInstance.current) return;

      const {
        color = 'var(--color-secondary)', // #1E56A0
        width = 4,
        opacity = 0.9,
        outlineColor = '#ffffff',
        outlineWidth = 8,
      } = options;

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

      // Agregar capa de sombra (efecto Google Maps)
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
          'line-opacity': 0.3,
          'line-translate': [2, 2],
        },
      });

      // Agregar capa de contorno (más gruesa, color diferente)
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
          'line-opacity': 1,
        },
      });

      // Agregar capa principal de la ruta
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
          'line-opacity': opacity,
        },
      });

      // Agregar capa de brillo (efecto Google Maps)
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
          'line-opacity': 0.3,
          'line-blur': 3,
        },
      });

      // Agregar puntos de inicio y fin
      addRouteEndpoints(routeId, coordinates);

      routeSources.current.add(sourceId);
      routeLayers.current.add(shadowLayerId);
      routeLayers.current.add(outlineLayerId);
      routeLayers.current.add(mainLayerId);
      routeLayers.current.add(glowLayerId);
    },
    [mapInstance, addRouteEndpoints, removeRouteFromMap],
  );

  const clearAllRoutes = useCallback(() => {
    if (!mapInstance.current) return;

    const sourcesToRemove = Array.from(routeSources.current);
    const layersToRemove = Array.from(routeLayers.current);

    // Remover todas las capas
    for (const layerId of layersToRemove) {
      if (mapInstance.current!.getLayer(layerId)) {
        mapInstance.current!.removeLayer(layerId);
      }
    }

    // Remover todas las fuentes
    for (const sourceId of sourcesToRemove) {
      if (mapInstance.current!.getSource(sourceId)) {
        mapInstance.current!.removeSource(sourceId);
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

      mapInstance.current.fitBounds(bounds, {
        padding: 50,
        duration: 1000,
      });
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
  };
}
