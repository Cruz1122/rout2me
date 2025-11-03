import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Stop, StopWithOrder } from '../api/stops_api';
import { FiX, FiPlus, FiMapPin, FiSave, FiTrash2 } from 'react-icons/fi';
import { processRouteWithCoordinates } from '../services/mapMatchingService';

interface StopEditorProps {
  variantId: string;
  routePath: { lat: number; lng: number }[];
  allStops: Stop[];
  assignedStops: StopWithOrder[];
  onSave: (stopIds: string[]) => Promise<void>;
  onCreateStop: (data: {
    name: string;
    location: { lat: number; lng: number };
  }) => Promise<Stop>;
  onClose: () => void;
}

export default function StopEditor({
  variantId,
  routePath,
  allStops,
  assignedStops,
  onSave,
  onCreateStop,
  onClose,
}: StopEditorProps) {
  console.log('🗺️ StopEditor props:', {
    variantId,
    routePath: routePath.length,
    allStops: allStops.length,
    assignedStops: assignedStops.length,
    assignedStopsData: assignedStops,
  });

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedStops, setSelectedStops] =
    useState<StopWithOrder[]>(assignedStops);
  const [isCreatingStop, setIsCreatingStop] = useState(false);
  const [newStopLocation, setNewStopLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [newStopName, setNewStopName] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const stopMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // Inicializar mapa
  useEffect(() => {
    console.log(
      '🗺️ Map useEffect triggered, mapContainer:',
      !!mapContainer.current,
      'mapInstance:',
      !!mapInstance.current,
    );
    if (!mapContainer.current || mapInstance.current) return;

    console.log('🗺️ Creating map instance...');

    const STADIA_API_KEY = import.meta.env.VITE_STADIA_API_KEY;
    console.log('🔑 Stadia API Key:', STADIA_API_KEY ? 'Loaded' : 'MISSING!');

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=${STADIA_API_KEY}`,
      center: [-75.5138, 5.0703],
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapInstance.current = map;

    console.log('🗺️ Map instance created, waiting for load...');

    // Esperar a que el mapa cargue
    map.on('load', async () => {
      console.log('🗺️ Map loaded successfully!');
      setMapReady(true); // ✅ Marcar el mapa como listo

      // Dibujar la ruta con map matching
      if (routePath.length > 0) {
        console.log('🛣️ Drawing route with', routePath.length, 'points');

        try {
          // Obtener coordenadas originales de la ruta
          const originalCoordinates = routePath.map(
            (point) => [point.lng, point.lat] as [number, number],
          );

          // Obtener la API key desde las variables de entorno
          const apiKey = import.meta.env.VITE_STADIA_API_KEY;
          const shouldApplyMapMatching = Boolean(
            apiKey && apiKey.trim() !== '',
          );

          // Procesar la ruta con map matching si está disponible
          const processedRoute = await processRouteWithCoordinates(
            originalCoordinates,
            apiKey,
            shouldApplyMapMatching,
          );

          // Usar las coordenadas procesadas (ajustadas a las calles)
          const matchedCoordinates = processedRoute.matchedGeometry
            .coordinates as [number, number][];

          // Crear GeoJSON para la ruta procesada
          const routeGeoJSON = {
            type: 'Feature' as const,
            properties: {},
            geometry: processedRoute.matchedGeometry,
          };

          // Agregar source y layer para la ruta
          map.addSource('route', {
            type: 'geojson',
            data: routeGeoJSON,
          });

          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          });

          // Ajustar vista a la ruta con animación suave
          const bounds = matchedCoordinates.reduce(
            (bounds, coord) => bounds.extend(coord),
            new maplibregl.LngLatBounds(
              matchedCoordinates[0],
              matchedCoordinates[0],
            ),
          );

          map.fitBounds(bounds, {
            padding: 80,
            duration: 1000,
          });
          console.log('🗺️ Route drawn with map matching and bounds fitted');
        } catch (error) {
          console.error('⚠️ Error drawing route:', error);
          // Fallback: dibujar ruta sin map matching
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routePath.map((p) => [p.lng, p.lat]),
              },
            },
          });

          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          });

          const bounds = routePath.reduce(
            (bounds, coord) => bounds.extend([coord.lng, coord.lat]),
            new maplibregl.LngLatBounds(
              [routePath[0].lng, routePath[0].lat],
              [routePath[0].lng, routePath[0].lat],
            ),
          );

          map.fitBounds(bounds, {
            padding: 80,
            duration: 1000,
          });
          console.log('🗺️ Route drawn without map matching (fallback)');
        }
      }
    });

    return () => {
      console.log('🗺️ Cleaning up map...');
      map.remove();
      mapInstance.current = null;
    };
  }, [routePath]);

  // Manejar evento de click para crear paradas
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.loaded()) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (isCreatingStop) {
        setNewStopLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isCreatingStop]);

  // Definir handleAddStop antes de usarlo en el useEffect
  const handleAddStop = useCallback((stop: Stop) => {
    setSelectedStops((prev) => {
      if (prev.find((s) => s.id === stop.id)) return prev;
      return [...prev, { ...stop, stop_order: prev.length + 1 }];
    });
  }, []);

  // Renderizar marcadores de paradas
  useEffect(() => {
    const map = mapInstance.current;
    console.log('🎯 Rendering markers - map:', !!map, 'mapReady:', mapReady);
    console.log('📍 Selected stops:', selectedStops.length, selectedStops);
    console.log('🗺️ All stops:', allStops.length, allStops);

    if (!map || !mapReady) {
      console.log('⚠️ Map not ready yet');
      return;
    }

    console.log('✅ Map is ready, rendering markers...');

    // Limpiar marcadores existentes
    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current.clear();

    // Agregar marcadores para paradas asignadas
    console.log('🟢 Adding', selectedStops.length, 'assigned stop markers');
    selectedStops.forEach((stop, index) => {
      // Validar que la parada tenga coordenadas válidas
      if (
        !stop.location ||
        typeof stop.location.lat !== 'number' ||
        typeof stop.location.lng !== 'number'
      ) {
        console.warn(
          `⚠️ Skipping assigned stop ${index + 1}: ${stop.name} - Invalid location:`,
          stop.location,
        );
        return;
      }

      console.log(`  ➕ Assigned stop ${index + 1}:`, stop.name, stop.location);
      const el = document.createElement('div');
      el.className = 'stop-marker-assigned';
      el.innerHTML = `
        <div style="
          background: #10b981;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${index + 1}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.location.lng, stop.location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>${stop.name}</strong>
              <p style="margin: 4px 0 0; font-size: 12px; color: #666;">Orden: ${index + 1}</p>
            </div>
          `),
        )
        .addTo(map);

      stopMarkersRef.current.set(stop.id, marker);
    });

    // Agregar marcadores para paradas no asignadas
    const assignedIds = new Set(selectedStops.map((s) => s.id));
    const unassignedStops = allStops.filter(
      (stop) => !assignedIds.has(stop.id),
    );
    console.log('⚪ Adding', unassignedStops.length, 'unassigned stop markers');

    unassignedStops.forEach((stop) => {
      // Validar que la parada tenga coordenadas válidas
      if (
        !stop.location ||
        typeof stop.location.lat !== 'number' ||
        typeof stop.location.lng !== 'number'
      ) {
        console.warn(
          `⚠️ Skipping unassigned stop: ${stop.name} - Invalid location:`,
          stop.location,
        );
        return;
      }

      console.log(`  ➕ Unassigned stop:`, stop.name, stop.location);
      const el = document.createElement('div');
      el.className = 'stop-marker-unassigned';
      el.innerHTML = `
        <div style="
          background: #6b7280;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
        ">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
          </svg>
        </div>
      `;

      el.addEventListener('click', () => {
        handleAddStop(stop);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.location.lng, stop.location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(`
            <div style="padding: 8px;">
              <strong>${stop.name}</strong>
              <p style="margin: 4px 0 0; font-size: 11px; color: #10b981;">Click para agregar</p>
            </div>
          `),
        )
        .addTo(map);

      stopMarkersRef.current.set(stop.id, marker);
    });

    console.log('✅ Total markers rendered:', stopMarkersRef.current.size);

    // Agregar marcador temporal para nueva parada
    if (newStopLocation) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: #f59e0b;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
          </svg>
        </div>
      `;

      new maplibregl.Marker({ element: el })
        .setLngLat([newStopLocation.lng, newStopLocation.lat])
        .addTo(mapInstance.current!);
    }
  }, [selectedStops, allStops, newStopLocation, mapReady, handleAddStop]);

  const handleRemoveStop = (stopId: string) => {
    setSelectedStops(selectedStops.filter((s) => s.id !== stopId));
  };

  const handleReorderStop = (stopId: string, direction: 'up' | 'down') => {
    const index = selectedStops.findIndex((s) => s.id === stopId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedStops.length - 1) return;

    const newStops = [...selectedStops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newStops[index], newStops[targetIndex]] = [
      newStops[targetIndex],
      newStops[index],
    ];
    setSelectedStops(newStops);
  };

  const handleCreateStop = async () => {
    if (!newStopName.trim() || !newStopLocation) return;

    try {
      const newStop = await onCreateStop({
        name: newStopName,
        location: newStopLocation,
      });

      // Agregar la nueva parada a la lista de seleccionadas
      setSelectedStops([
        ...selectedStops,
        { ...newStop, stop_order: selectedStops.length + 1 },
      ]);

      // Resetear estado
      setNewStopName('');
      setNewStopLocation(null);
      setIsCreatingStop(false);
    } catch (error) {
      console.error('Error creating stop:', error);
      alert('Error al crear la parada');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedStops.map((s) => s.id));
      onClose();
    } catch (error) {
      console.error('Error saving stops:', error);
      alert('Error al guardar las paradas');
    } finally {
      setSaving(false);
    }
  };

  const filteredStops = allStops.filter((stop) =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Editor de Paradas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Lista de paradas */}
          <div className="w-80 border-r flex flex-col bg-gray-50">
            {/* Controles */}
            <div className="p-4 space-y-3 border-b bg-white">
              <button
                onClick={() => setIsCreatingStop(!isCreatingStop)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCreatingStop
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <FiPlus />
                {isCreatingStop ? 'Cancelar Creación' : 'Crear Nueva Parada'}
              </button>

              <input
                type="text"
                placeholder="Buscar paradas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Paradas Seleccionadas */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Paradas Asignadas ({selectedStops.length})
              </h3>
              <div className="space-y-2 mb-4">
                {selectedStops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="bg-white p-3 rounded-lg border-2 border-green-200 flex items-start gap-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm">{stop.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorderStop(stop.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Subir"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleReorderStop(stop.id, 'down')}
                        disabled={index === selectedStops.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Bajar"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveStop(stop.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Remover"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Paradas Disponibles
              </h3>
              <div className="space-y-2">
                {filteredStops
                  .filter(
                    (stop) => !selectedStops.find((s) => s.id === stop.id),
                  )
                  .map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => handleAddStop(stop)}
                      className="w-full bg-white p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-gray-400" />
                        <span className="font-medium text-sm">{stop.name}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="flex-1 relative min-h-0">
            <div
              ref={mapContainer}
              className="absolute inset-0 w-full h-full"
            />

            {/* Panel de creación de parada */}
            {isCreatingStop && (
              <div className="absolute top-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg border-2 border-amber-400">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FiMapPin className="text-amber-600" />
                  Crear Nueva Parada
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {newStopLocation
                    ? 'Ingresa el nombre de la parada:'
                    : 'Haz click en el mapa para seleccionar la ubicación'}
                </p>

                {newStopLocation && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre de la parada"
                      value={newStopName}
                      onChange={(e) => setNewStopName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateStop}
                        disabled={!newStopName.trim()}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Crear Parada
                      </button>
                      <button
                        onClick={() => {
                          setNewStopLocation(null);
                          setNewStopName('');
                        }}
                        className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedStops.length} parada{selectedStops.length !== 1 ? 's' : ''}{' '}
            asignada
            {selectedStops.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              <FiSave />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
