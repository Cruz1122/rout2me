import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteMapEditorProps {
  initialPath?: Coordinate[];
  onPathChange: (path: Coordinate[]) => void;
}

export default function RouteMapEditor({
  initialPath = [],
  onPathChange,
}: RouteMapEditorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [path, setPath] = useState<Coordinate[]>(initialPath);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Función para agregar marcador
  const addMarker = (point: Coordinate, index: number) => {
    if (!map.current) return;

    // Crear elemento del marcador con número
    const el = document.createElement('div');
    el.className = 'route-marker';
    el.style.cssText = `
      background-color: #1980e6;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
    `;
    el.textContent = (index + 1).toString();

    const marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([point.lng, point.lat])
      .addTo(map.current);

    // Manejar arrastre del marcador
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      setPath((prevPath) => {
        const newPath = [...prevPath];
        // Encontrar el índice actual del marcador
        const currentIndex = markersRef.current.indexOf(marker);
        if (currentIndex !== -1) {
          newPath[currentIndex] = { lat: lngLat.lat, lng: lngLat.lng };
          onPathChange(newPath);
        }
        return newPath;
      });
    });

    // Click en marcador para eliminarlo
    el.addEventListener('click', (e) => {
      e.stopPropagation();

      // Obtener el índice actual del marcador en el array
      const currentIndex = markersRef.current.indexOf(marker);
      if (currentIndex === -1) return;

      // Eliminar el punto directamente sin confirmación
      setPath((prevPath) => {
        const newPath = prevPath.filter((_, i) => i !== currentIndex);
        onPathChange(newPath);
        return newPath;
      });
    });

    markersRef.current.push(marker);
  };

  // Función para actualizar la línea
  const updateLine = (currentPath: Coordinate[]) => {
    if (!map.current || currentPath.length < 2) {
      // Remover línea si hay menos de 2 puntos
      if (map.current?.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      return;
    }

    // Filtrar puntos válidos antes de mapear
    const validPath = currentPath.filter(
      (p) => p && p.lng != null && p.lat != null,
    );

    if (validPath.length < 2) {
      if (map.current?.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      return;
    }

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: validPath.map((p) => [p.lng, p.lat]),
      },
    };

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as maplibregl.GeoJSONSource).setData(
        geojson,
      );
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: geojson,
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#1980e6',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    }
  };

  // Limpiar ruta
  const clearPath = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    setPath([]);
    onPathChange([]);

    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
  };

  // Eliminar el último punto
  const removeLastPoint = () => {
    if (path.length === 0) return;

    setPath((prevPath) => {
      const newPath = prevPath.slice(0, -1);
      onPathChange(newPath);
      return newPath;
    });
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('Inicializando mapa...');

    // Inicializar el mapa
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [-75.5636, 5.0689], // Manizales, Colombia
      zoom: 13,
    });

    // Agregar controles
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Esperar a que el mapa se cargue
    map.current.on('load', () => {
      console.log('Mapa cargado');
      setMapLoaded(true);

      // Cargar path inicial si existe
      if (initialPath.length > 0) {
        console.log('Cargando path inicial:', initialPath);
        initialPath.forEach((point, index) => {
          addMarker(point, index);
        });
        updateLine(initialPath);

        if (map.current) {
          map.current.setCenter([initialPath[0].lng, initialPath[0].lat]);
        }
      }
    });

    // Manejar clics en el mapa
    map.current.on('click', (e) => {
      console.log('Click en mapa:', e.lngLat);
      const newPoint: Coordinate = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      };

      setPath((prevPath) => {
        const newPath = [...prevPath, newPoint];
        onPathChange(newPath);
        return newPath;
      });
    });

    return () => {
      console.log('Limpiando mapa');
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Efecto para actualizar marcadores y línea cuando cambia el path
  useEffect(() => {
    // Solo ejecutar si el mapa está cargado
    if (!map.current || !mapLoaded) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Agregar marcadores para cada punto
    path.forEach((point, index) => {
      if (point && point.lng != null && point.lat != null) {
        addMarker(point, index);
      }
    });

    // Actualizar línea
    updateLine(path);
  }, [path, mapLoaded]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-[#646f87]">
          <p className="font-medium">Puntos marcados: {path.length}</p>
          <p className="text-xs">
            Click en el mapa para agregar puntos. Click en marcador para
            eliminarlo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={removeLastPoint}
            disabled={path.length === 0}
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              path.length > 0
                ? 'text-orange-600 hover:bg-orange-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title="Deshacer último punto"
          >
            ← Deshacer
          </button>
          <button
            onClick={clearPath}
            disabled={path.length === 0}
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              path.length > 0
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Limpiar Todo
          </button>
        </div>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-[500px] rounded-xl border border-[#dcdfe5] overflow-hidden bg-gray-100"
        style={{ minHeight: '500px' }}
      />

      {path.length > 0 && (
        <div className="p-3 bg-[#f0f2f4] rounded-lg">
          <p className="text-xs text-[#646f87] font-mono">
            {path.length} coordenadas •
            {path.length >= 2
              ? ` ${path.length - 1} segmentos`
              : ' (mínimo 2 puntos)'}
          </p>
        </div>
      )}
    </div>
  );
}
