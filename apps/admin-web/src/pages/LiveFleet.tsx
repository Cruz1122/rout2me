import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getVehicles,
  getBusPositions,
  getRouteVariants,
  getCompanies,
} from '../api/vehicles_api';
import type {
  Vehicle,
  BusPosition,
  RouteVariant,
  Company,
} from '../api/vehicles_api';
import maplibregl, { Map as MlMap } from 'maplibre-gl';
import {
  RiFocus3Line,
  RiAddLine,
  RiSubtractLine,
  RiCompassLine,
} from 'react-icons/ri';
import { processRouteWithCoordinates } from '../services/mapMatchingService';
import PageHeader from '../components/PageHeader';

// Iconos SVG como componentes
const TruckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24px"
    height="24px"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24px"
    height="24px"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
  </svg>
);

export default function LiveFleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [busPositions, setBusPositions] = useState<BusPosition[]>([]);
  const [routeVariants, setRouteVariants] = useState<RouteVariant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );

  // Referencias para el mapa
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const vehicleMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userLocationMarker = useRef<maplibregl.Marker | null>(null);
  const routeLayerId = useRef<string | null>(null);
  const stopMarkers = useRef<maplibregl.Marker[]>([]);
  const vehiclesRef = useRef<Vehicle[]>([]); // Ref para mantener vehicles actualizado
  const [mapBearing, setMapBearing] = useState(0);
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    bearing: number;
  } | null>(null);

  // Mantener la ref sincronizada con el estado
  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  useEffect(() => {
    const initializeData = async () => {
      const myVehicles = await loadVehicles(); // Cargar primero los vehículos de mi org
      await loadBusPositions(myVehicles); // Filtrar posiciones por mis vehículos
      await loadRouteVariants();
      await loadCompanies();
    };

    initializeData();

    // Actualizar posiciones cada 10 segundos
    const interval = setInterval(() => {
      loadBusPositions(); // Aquí usará el estado actualizado
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  async function loadVehicles() {
    try {
      setLoading(true);
      const data = await getVehicles();
      console.log('Vehicles loaded (my org):', data.length);
      setVehicles(data);
      vehiclesRef.current = data; // Actualizar la ref inmediatamente
      return data; // Retornar para usarlo inmediatamente
    } catch (err) {
      console.error('Error loading vehicles:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const loadBusPositions = useCallback(async (myVehicles?: Vehicle[]) => {
    try {
      const data = await getBusPositions();
      console.log('All bus positions loaded:', data.length);

      // Usar los vehículos pasados como parámetro o los de la ref actualizada
      const vehiclesToFilter = myVehicles || vehiclesRef.current;

      if (vehiclesToFilter.length === 0) {
        console.warn('No vehicles loaded yet, skipping position filter');
        return;
      }

      const myBusIds = new Set(vehiclesToFilter.map((v) => v.id));
      const filteredPositions = data.filter((pos) => myBusIds.has(pos.bus_id));

      console.log('Filtered bus positions (my org):', filteredPositions.length);
      console.log('My bus IDs:', Array.from(myBusIds));
      setBusPositions(filteredPositions);
    } catch (err) {
      console.error('Error loading bus positions:', err);
    }
  }, []); // Sin dependencias porque usa vehiclesRef

  async function loadRouteVariants() {
    try {
      const routes = await getRouteVariants();
      setRouteVariants(routes);
    } catch (err) {
      console.error('Error loading route variants:', err);
    }
  }

  async function loadCompanies() {
    try {
      const companiesData = await getCompanies();
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  }

  // Inicializar el mapa cuando el componente se monta
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors © CARTO',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            paint: {
              'raster-fade-duration': 300,
            },
          },
        ],
      },
      center: [-75.5138, 5.0703], // Manizales, Colombia
      zoom: 13,
      maxZoom: 19,
      minZoom: 5,
    });

    map.on('load', () => {
      // Intentar obtener ubicación del usuario
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            // Crear marcador de ubicación del usuario
            const element = document.createElement('div');
            element.style.cssText = `
              background: #0EA5E9;
              border: 4px solid #ffffff;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
              cursor: pointer;
            `;

            userLocationMarker.current = new maplibregl.Marker({
              element,
              anchor: 'center',
            })
              .setLngLat([longitude, latitude])
              .addTo(map);
          },
          () => {
            // Error silencioso
          },
        );
      }
    });

    map.on('rotate', () => {
      setMapBearing(map.getBearing());
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Filtrar vehículos por búsqueda
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.plate
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Función para limpiar ruta y paradas del mapa
  const clearRouteFromMap = useCallback(() => {
    if (!mapInstance.current) return;

    // Limpiar layer y source de la ruta
    if (routeLayerId.current) {
      if (mapInstance.current.getLayer(routeLayerId.current)) {
        mapInstance.current.removeLayer(routeLayerId.current);
      }
      if (mapInstance.current.getSource(routeLayerId.current)) {
        mapInstance.current.removeSource(routeLayerId.current);
      }
      routeLayerId.current = null;
    }

    // Limpiar marcadores de paradas
    stopMarkers.current.forEach((marker) => marker.remove());
    stopMarkers.current = [];
  }, []);

  // Función para dibujar ruta y paradas en el mapa
  const drawRouteOnMap = useCallback(
    async (route: RouteVariant) => {
      if (!mapInstance.current) return;

      // Limpiar ruta anterior
      clearRouteFromMap();

      // Obtener coordenadas originales de la ruta
      const originalCoordinates = route.path.map(
        (point) => [point.lng, point.lat] as [number, number],
      );

      // Obtener la API key desde las variables de entorno
      const apiKey = import.meta.env.VITE_STADIA_API_KEY;
      const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

      try {
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

        const sourceId = `route-${route.variant_id}`;
        routeLayerId.current = sourceId;

        // Agregar source y layer para la ruta
        mapInstance.current.addSource(sourceId, {
          type: 'geojson',
          data: routeGeoJSON,
        });

        mapInstance.current.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
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

        // Agregar marcadores para las paradas
        route.stops.forEach((stop) => {
          const el = document.createElement('div');
          el.innerHTML = `
          <div style="
            background: white;
            border: 3px solid #3b82f6;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          "></div>
        `;

          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center',
          })
            .setLngLat([stop.location.lng, stop.location.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 15 }).setHTML(`
              <div style="padding: 8px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">Parada</h4>
                <p style="margin: 0; font-size: 12px;">${stop.name}</p>
              </div>
            `),
            )
            .addTo(mapInstance.current!);

          stopMarkers.current.push(marker);
        });

        // Ajustar vista para mostrar toda la ruta
        const bounds = matchedCoordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new maplibregl.LngLatBounds(
            matchedCoordinates[0],
            matchedCoordinates[0],
          ),
        );

        mapInstance.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
        });

        // Log de información del map matching
        if (shouldApplyMapMatching) {
          console.log('Map matching aplicado:', {
            confidence: processedRoute.confidence,
            distance: `${(processedRoute.distance / 1000).toFixed(2)} km`,
            duration: `${Math.round(processedRoute.duration / 60)} min`,
            pointsOriginal: originalCoordinates.length,
            pointsMatched: matchedCoordinates.length,
          });
        }
      } catch (error) {
        console.error('Error al dibujar la ruta:', error);

        // Fallback: usar coordenadas originales si falla el map matching
        const routeGeoJSON = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: originalCoordinates,
          },
        };

        const sourceId = `route-${route.variant_id}`;
        routeLayerId.current = sourceId;

        mapInstance.current.addSource(sourceId, {
          type: 'geojson',
          data: routeGeoJSON,
        });

        mapInstance.current.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
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

        // Agregar marcadores para las paradas
        route.stops.forEach((stop) => {
          const el = document.createElement('div');
          el.innerHTML = `
          <div style="
            background: white;
            border: 3px solid #3b82f6;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          "></div>
        `;

          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center',
          })
            .setLngLat([stop.location.lng, stop.location.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 15 }).setHTML(`
              <div style="padding: 8px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">Parada</h4>
                <p style="margin: 0; font-size: 12px;">${stop.name}</p>
              </div>
            `),
            )
            .addTo(mapInstance.current!);

          stopMarkers.current.push(marker);
        });

        // Ajustar vista para mostrar toda la ruta
        const bounds = originalCoordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new maplibregl.LngLatBounds(
            originalCoordinates[0],
            originalCoordinates[0],
          ),
        );

        mapInstance.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
        });
      }
    },
    [clearRouteFromMap],
  );

  // Función para manejar el clic en un vehículo
  const handleVehicleClick = useCallback(
    (vehicle: Vehicle) => {
      setSelectedVehicleId(vehicle.id);

      // Buscar la posición del vehículo
      const position = busPositions.find((pos) => pos.bus_id === vehicle.id);

      // Si el vehículo no tiene posición, limpiar ruta y salir
      if (!position || !position.location_json) {
        clearRouteFromMap();
        return;
      }

      // Si el bus tiene una ruta activa, mostrarla
      if (position.active_route_variant_id) {
        const route = routeVariants.find(
          (r) => r.variant_id === position.active_route_variant_id,
        );
        if (route) {
          drawRouteOnMap(route);
          return; // La función drawRouteOnMap ya ajusta la vista
        }
      }

      // Si no tiene ruta activa, limpiar ruta anterior y centrar en el bus
      clearRouteFromMap();

      if (mapInstance.current) {
        const { lat, lng } = position.location_json;

        // Centrar el mapa en el vehículo con animación
        mapInstance.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 1500,
        });

        // Abrir el popup del marcador
        const marker = vehicleMarkers.current.get(vehicle.id);
        if (marker) {
          marker.togglePopup();
        }
      }
    },
    [busPositions, routeVariants, clearRouteFromMap, drawRouteOnMap],
  );

  // Actualizar marcadores de vehículos cuando cambie la lista
  useEffect(() => {
    if (!mapInstance.current) return;

    // Limpiar marcadores existentes
    vehicleMarkers.current.forEach((marker) => marker.remove());
    vehicleMarkers.current.clear();

    // Agregar marcadores para vehículos filtrados con sus posiciones reales
    filteredVehicles.forEach((vehicle) => {
      // Buscar la posición del bus
      const position = busPositions.find((pos) => pos.bus_id === vehicle.id);

      // Si no hay posición, no mostrar el marcador
      if (!position || !position.location_json) return;

      const { lat, lng } = position.location_json;

      // Crear elemento del marcador con color según estado
      const element = document.createElement('div');
      const isSelected = selectedVehicleId === vehicle.id;
      const color =
        vehicle.status === 'AVAILABLE'
          ? '#10b981'
          : vehicle.status === 'IN_SERVICE'
            ? '#3b82f6'
            : vehicle.status === 'MAINTENANCE'
              ? '#f59e0b'
              : '#ef4444';

      element.innerHTML = `
        <div style="
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          width: ${isSelected ? '40px' : '32px'};
          height: ${isSelected ? '40px' : '32px'};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, ${isSelected ? '0.5' : '0.3'});
          transition: all 0.2s;
          transform: scale(${isSelected ? '1.1' : '1'});
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 256 256">
            <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z"/>
          </svg>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element,
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current!);

      // Agregar evento de clic al marcador
      element.addEventListener('click', () => {
        handleVehicleClick(vehicle);
      });

      // Buscar información de la compañía
      const company = companies.find((c) => c.id === position.company_id);
      const companyName = company
        ? company.short_name || company.name
        : 'Sin compañía';

      // Agregar popup con información del vehículo
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${vehicle.plate}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Compañía: ${companyName}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${getVehicleDisplayStatus(vehicle.status)}</p>
            ${position.speed_kph !== undefined ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">Velocidad: ${position.speed_kph.toFixed(1)} km/h</p>` : ''}
          </div>
        `);

      marker.setPopup(popup);

      // Guardar referencia del marcador
      vehicleMarkers.current.set(vehicle.id, marker);
    });
  }, [
    filteredVehicles,
    busPositions,
    selectedVehicleId,
    handleVehicleClick,
    companies,
  ]);

  // Manejo de controles del mapa
  const handleZoomIn = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.zoomOut({ duration: 300 });
  }, []);

  const handleLocationRequest = useCallback(() => {
    if (!mapInstance.current || !userLocationMarker.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.current?.easeTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 800,
          });
        },
        (error) => {
          if (error.code === 1) {
            alert(
              'Por favor, permite el acceso a tu ubicación para usar esta función.',
            );
          }
        },
        {
          enableHighAccuracy: false,
          maximumAge: 60000,
        },
      );
    }
  }, []);

  const handleResetBearing = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 500,
    });
  }, []);

  const handleCompassMouseDown = useCallback((e: React.MouseEvent) => {
    if (!mapInstance.current) return;
    e.preventDefault();
    setIsDraggingCompass(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      bearing: mapInstance.current.getBearing(),
    });
  }, []);

  const handleCompassMove = useCallback(
    (clientX: number) => {
      if (!mapInstance.current || !isDraggingCompass || !dragStart) return;

      const deltaX = clientX - dragStart.x;
      const newBearing = dragStart.bearing + deltaX;

      mapInstance.current.setBearing(newBearing);
      setMapBearing(newBearing);
    },
    [isDraggingCompass, dragStart],
  );

  const handleCompassEnd = useCallback(() => {
    setIsDraggingCompass(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (!isDraggingCompass) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleCompassMove(e.clientX);
    };

    const handleMouseUp = () => handleCompassEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingCompass, handleCompassMove, handleCompassEnd]);

  // Función para obtener el estado del vehículo basado en su status
  const getVehicleDisplayStatus = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'Disponible';
      case 'IN_SERVICE':
        return 'En Servicio';
      case 'MAINTENANCE':
        return 'Mantenimiento';
      case 'OUT_OF_SERVICE':
        return 'Fuera de Servicio';
      default:
        return status; // Mostrar el valor original si no coincide
    }
  };

  // Función para obtener el porcentaje de capacidad (por defecto 0% hasta que se implemente)
  const getVehicleCapacityLevel = (): number => {
    return 0;
  };

  return (
    <>
      <PageHeader title="Flota en Vivo" />

      <div className="flex h-full gap-1 px-6 py-5">
        {/* Panel Izquierdo - Lista de Vehículos */}
        <div className="flex w-80 flex-col">
          {/* Buscador */}
          <div className="px-4 py-3">
            <label className="flex h-12 w-full min-w-40 flex-col">
              <div className="flex h-full w-full flex-1 items-stretch rounded-xl">
                <div className="flex items-center justify-center rounded-l-xl border-r-0 bg-[#f0f2f4] pl-4 text-[#646f87]">
                  <SearchIcon />
                </div>
                <input
                  placeholder="Buscar vehículos"
                  className="form-input flex h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl rounded-l-none border-l-0 border-none bg-[#f0f2f4] px-4 pl-2 text-base font-normal leading-normal text-[#111317] placeholder:text-[#646f87] focus:border-none focus:outline-0 focus:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </label>
          </div>

          {/* Lista de Vehículos */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-[#646f87]">Cargando vehículos...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-[#646f87]">
                  No se encontraron vehículos
                </p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => {
                const position = busPositions.find(
                  (pos) => pos.bus_id === vehicle.id,
                );
                const hasPosition = position && position.location_json;
                const isSelected = selectedVehicleId === vehicle.id;

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => handleVehicleClick(vehicle)}
                    className={`flex min-h-[72px] items-center justify-between gap-4 px-4 py-2 cursor-pointer transition-all
                    ${
                      isSelected && !hasPosition
                        ? 'bg-red-50 border-l-4 border-red-500'
                        : isSelected && hasPosition
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#f0f2f4] text-[#111317]">
                        <TruckIcon />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="line-clamp-1 text-base font-medium leading-normal text-[#111317]">
                          {vehicle.plate}
                        </p>
                        <p className="line-clamp-2 text-sm font-normal leading-normal text-[#646f87]">
                          {getVehicleDisplayStatus(vehicle.status)}
                        </p>
                        {!hasPosition && (
                          <p className="text-xs text-red-500 mt-1 font-medium">
                            ⚠️ Sin ubicación disponible
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <p className="text-base font-normal leading-normal text-[#111317]">
                        {getVehicleCapacityLevel()}%
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Derecho - Mapa */}
        <div className="flex max-w-[960px] flex-1 flex-col">
          <div className="@container flex h-full flex-col">
            <div className="flex flex-1 flex-col @[480px]:px-4 @[480px]:py-3">
              <div
                ref={mapRef}
                className="@[480px]:rounded-xl flex min-h-[320px] flex-1 relative"
                style={{
                  backgroundColor: '#e5e7eb',
                }}
              >
                {/* Controles del Mapa */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  {/* Zoom Controls */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={handleZoomIn}
                      className="flex size-10 items-center justify-center rounded-t-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors"
                    >
                      <RiAddLine size={20} className="text-[#111317]" />
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="flex size-10 items-center justify-center rounded-b-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors"
                    >
                      <RiSubtractLine size={20} className="text-[#111317]" />
                    </button>
                  </div>

                  {/* Compass Control */}
                  <button
                    onClick={handleResetBearing}
                    onMouseDown={handleCompassMouseDown}
                    className={`flex size-10 items-center justify-center rounded-xl transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-gray-50
                    ${isDraggingCompass ? 'cursor-grabbing scale-105 bg-[#1E56A0]' : 'cursor-pointer bg-white'}`}
                    aria-label="Arrastrar para rotar - Click para resetear"
                  >
                    <RiCompassLine
                      size={20}
                      style={{
                        color: isDraggingCompass ? '#FFFFFF' : '#111317',
                        transform: `rotate(${mapBearing}deg)`,
                        transition: isDraggingCompass
                          ? 'none'
                          : 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {/* Location Control */}
                  <button
                    onClick={handleLocationRequest}
                    className="flex size-10 items-center justify-center rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors"
                    aria-label="Mi ubicación"
                  >
                    <RiFocus3Line size={20} className="text-[#111317]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
