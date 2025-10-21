import { useEffect, useRef } from 'react';
import { Map as MlMap } from 'maplibre-gl';

interface RouteAnimationProps {
  mapInstance: React.RefObject<MlMap | null>;
  routeId: string;
  coordinates: [number, number][];
  isActive: boolean;
}

export default function RouteAnimation({
  mapInstance,
  routeId,
  coordinates,
  isActive,
}: RouteAnimationProps) {
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);

  useEffect(() => {
    if (!mapInstance.current || !isActive || coordinates.length < 2) return;

    const animateRoute = () => {
      if (!mapInstance.current) return;

      const sourceId = `route-animation-${routeId}`;
      const layerId = `route-animation-layer-${routeId}`;

      // Crear fuente de datos para la animación
      if (!mapInstance.current.getSource(sourceId)) {
        mapInstance.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        });
      }

      // Crear capa de animación si no existe
      if (!mapInstance.current.getLayer(layerId)) {
        mapInstance.current.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#FFD700',
            'line-width': 6,
            'line-opacity': 0.8,
          },
        });
      }

      // Calcular progreso de la animación
      progressRef.current += 0.02;
      if (progressRef.current > 1) {
        progressRef.current = 0;
      }

      // Calcular coordenadas parciales basadas en el progreso
      const totalPoints = coordinates.length;
      const currentPoint = Math.floor(progressRef.current * (totalPoints - 1));
      const nextPoint = Math.min(currentPoint + 1, totalPoints - 1);
      const segmentProgress = (progressRef.current * (totalPoints - 1)) % 1;

      const startCoord = coordinates[currentPoint];
      const endCoord = coordinates[nextPoint];

      // Interpolar entre puntos
      const interpolatedCoord: [number, number] = [
        startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress,
        startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress,
      ];

      // Crear geometría parcial
      const partialCoordinates = coordinates.slice(0, currentPoint + 1);
      partialCoordinates.push(interpolatedCoord);

      // Actualizar datos de la fuente
      const source = mapInstance.current.getSource(sourceId) as any;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: partialCoordinates,
          },
        });
      }

      animationRef.current = requestAnimationFrame(animateRoute);
    };

    if (isActive) {
      progressRef.current = 0;
      animateRoute();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Limpiar capa de animación
      if (mapInstance.current) {
        const layerId = `route-animation-layer-${routeId}`;
        const sourceId = `route-animation-${routeId}`;

        if (mapInstance.current.getLayer(layerId)) {
          mapInstance.current.removeLayer(layerId);
        }
        if (mapInstance.current.getSource(sourceId)) {
          mapInstance.current.removeSource(sourceId);
        }
      }
    };
  }, [mapInstance, routeId, coordinates, isActive]);

  return null;
}
