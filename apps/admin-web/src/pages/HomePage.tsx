import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { colorClasses } from '../styles/colors';
import GlobalLoader from '../components/GlobalLoader';
import PageHeader from '../components/PageHeader';
import R2MFilterSwitcher from '../components/R2MFilterSwitcher';
import type { FilterOption } from '../components/R2MFilterSwitcher';
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
import { RiAddLine, RiSubtractLine, RiCompassLine } from 'react-icons/ri';
import { processRouteWithCoordinates } from '../services/mapMatchingService';

// Colores específicos por compañía
const COMPANY_COLORS: Record<string, string> = {
  SOCOBUSES: '#3b82f6', // Azul
  GRANCALDAS: '#f97316', // Naranja
  SIDERAL: '#ef4444', // Rojo (para el rojo de sideral)
};

// Colores de respaldo para otras compañías
const FALLBACK_COLORS = [
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
];

// Función para obtener color por nombre de compañía
function getCompanyColor(
  companyId: string | null | undefined,
  companyMap: Map<string, Company>,
  colorMap: Map<string, string>,
): string {
  // Si no hay companyId, usar un color por defecto
  if (!companyId) {
    return '#64748b'; // slate-500 (gris)
  }

  // Si ya está en el mapa de colores, retornar ese color
  if (colorMap.has(companyId)) {
    return colorMap.get(companyId)!;
  }

  // Buscar el nombre de la compañía
  const company = companyMap.get(companyId);
  let assignedColor: string = '#64748b'; // Color por defecto

  if (company) {
    const companyName = company.short_name || company.name;
    const upperName = companyName.toUpperCase();

    // Buscar coincidencia en los colores predefinidos
    let foundColor = false;
    for (const [key, color] of Object.entries(COMPANY_COLORS)) {
      if (upperName.includes(key)) {
        assignedColor = color;
        foundColor = true;
        break;
      }
    }

    // Si no hay coincidencia, usar un color de respaldo basado en hash
    if (!foundColor) {
      let hash = 0;
      for (let i = 0; i < companyId.length; i++) {
        hash = companyId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % FALLBACK_COLORS.length;
      assignedColor = FALLBACK_COLORS[index];
    }
  } else {
    // Si no se encuentra la compañía, usar color basado en hash del ID
    let hash = 0;
    for (let i = 0; i < companyId.length; i++) {
      hash = companyId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % FALLBACK_COLORS.length;
    assignedColor = FALLBACK_COLORS[index];
  }

  // IMPORTANTE: Guardar el color en el mapa para uso futuro
  colorMap.set(companyId, assignedColor);

  return assignedColor;
}

export default function HomePage() {
  // Estados para el mapa
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [busPositions, setBusPositions] = useState<BusPosition[]>([]);
  const [routeVariants, setRouteVariants] = useState<RouteVariant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [activeRoutesCount, setActiveRoutesCount] = useState(0); // Rutas con buses activos y GPS

  // Función para obtener el estado del vehículo en español
  const getVehicleDisplayStatus = useCallback((status: string): string => {
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
        return status;
    }
  }, []);

  // Referencias para el mapa
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const vehicleMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const routeLayersIds = useRef<Set<string>>(new Set());
  const vehiclesRef = useRef<Vehicle[]>([]); // Ref para mantener vehicles actualizado
  const companiesRef = useRef<Company[]>([]); // Ref para mantener companies actualizado
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

  // Mantener la ref de companies sincronizada
  useEffect(() => {
    companiesRef.current = companies;
  }, [companies]);

  // Cargar datos iniciales
  useEffect(() => {
    const initializeData = async () => {
      await loadCompanies(); // Cargar primero las compañías
      await loadRouteVariants();
      const myVehicles = await loadVehicles(); // Luego los vehículos de mi org
      await loadBusPositions(myVehicles); // Filtrar posiciones por vehículos de mis compañías
    };

    initializeData();

    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      loadBusPositions(); // Aquí usará el estado actualizado
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
      vehiclesRef.current = data; // Actualizar la ref inmediatamente
      return data; // Retornar para usarlo inmediatamente
    } catch (error) {
      console.error('Error loading vehicles:', error);
      return [];
    }
  };

  const loadBusPositions = useCallback(async (myVehicles?: Vehicle[]) => {
    try {
      const data = await getBusPositions();

      console.log(
        '🔍 [loadBusPositions] Raw data from API:',
        data.length,
        'positions',
      );
      console.log('🔍 [loadBusPositions] First position raw:', data[0]);
      console.log(
        '🔍 [loadBusPositions] First position location_json:',
        data[0]?.location_json,
      );

      // Usar los vehículos pasados como parámetro o los de la ref actualizada
      const vehiclesToFilter = myVehicles || vehiclesRef.current;

      if (vehiclesToFilter.length === 0) {
        console.warn('No vehicles loaded yet, skipping position filter');
        return;
      }

      // Usar la ref actualizada de companies
      const currentCompanies = companiesRef.current;

      // Crear set de company_ids de las compañías a las que tengo acceso
      const myCompanyIds = new Set(currentCompanies.map((c) => c.id));

      // Filtrar solo vehículos que pertenecen a mis compañías
      const vehiclesInMyCompanies = vehiclesToFilter.filter(
        (v) => v.company_id && myCompanyIds.has(v.company_id),
      );
      const myBusIds = new Set(vehiclesInMyCompanies.map((v) => v.id));

      // Filtrar por vehículos de mis compañías
      const filteredPositions = data.filter((pos) => myBusIds.has(pos.bus_id));

      console.log(
        '🔍 [loadBusPositions] Filtered positions:',
        filteredPositions.length,
      );
      console.log(
        '🔍 [loadBusPositions] First filtered position:',
        filteredPositions[0],
      );
      console.log(
        '🔍 [loadBusPositions] First filtered location_json:',
        filteredPositions[0]?.location_json,
      );

      setBusPositions(filteredPositions);
    } catch (error) {
      console.error('Error loading bus positions:', error);
    }
  }, []); // Sin dependencias porque usa refs

  const loadRouteVariants = async () => {
    try {
      const data = await getRouteVariants();
      setRouteVariants(data);
    } catch (error) {
      console.error('Error loading route variants:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  // Crear mapeo de company_id a Company para búsquedas rápidas
  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach((company) => {
      map.set(company.id, company);
    });
    return map;
  }, [companies]);

  // Crear mapeo de company_id a color basándose en el nombre de la compañía
  const companyColorMap = useMemo(() => {
    const map = new Map<string, string>();

    // Obtener todos los company_id únicos de los buses con posición
    const uniqueCompanyIds = new Set<string>();
    busPositions.forEach((pos) => {
      if (pos.company_id) {
        uniqueCompanyIds.add(pos.company_id);
      }
    });

    // Asignar colores a cada company_id basándose en el nombre de la compañía
    uniqueCompanyIds.forEach((companyId) => {
      const color = getCompanyColor(companyId, companyMap, map);
      map.set(companyId, color);
    });

    return map;
  }, [busPositions, companyMap]);

  // Inicializar mapa
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
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [-75.5138, 5.0703], // Manizales, Colombia
      zoom: 12,
    });

    map.on('load', () => {
      map.resize();
      setMapReady(true);
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

  // Dibujar todas las rutas en el mapa (solo una vez al cargar)
  useEffect(() => {
    if (
      !mapInstance.current ||
      !mapReady ||
      routeVariants.length === 0 ||
      busPositions.length === 0
    )
      return;

    // Verificar que las compañías estén cargadas
    if (companyMap.size === 0) {
      return;
    }

    // IMPORTANTE: Solo dibujar rutas UNA VEZ para evitar consumir API de map matching
    if (routeLayersIds.current.size > 0) {
      return;
    }

    const drawAllRoutes = async () => {
      // Obtener API key
      const apiKey = import.meta.env.VITE_STADIA_API_KEY;
      const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

      // Agrupar buses por ruta para dibujar cada combinación ruta-empresa
      // IMPORTANTE: Solo considerar buses que tienen ubicación GPS (están en busPositions)
      const routeBusMap = new Map<
        string,
        Array<{ busId: string; companyId: string }>
      >();
      busPositions.forEach((pos) => {
        // Solo agregar si tiene ruta activa, company_id Y ubicación GPS válida
        if (
          pos.active_route_variant_id &&
          pos.company_id &&
          pos.location_json
        ) {
          if (!routeBusMap.has(pos.active_route_variant_id)) {
            routeBusMap.set(pos.active_route_variant_id, []);
          }
          routeBusMap.get(pos.active_route_variant_id)!.push({
            busId: pos.bus_id,
            companyId: pos.company_id,
          });
        }
      });

      // Filtrar solo las rutas que tienen buses activos CON UBICACIÓN GPS
      const activeRoutes = routeVariants.filter((route) =>
        routeBusMap.has(route.variant_id),
      );

      // Actualizar el contador de rutas activas para los KPIs
      setActiveRoutesCount(activeRoutes.length);

      // Dibujar rutas solo para las que tienen buses activos
      for (const route of activeRoutes) {
        const busesOnRoute = routeBusMap.get(route.variant_id)!;

        try {
          const originalCoordinates = route.path.map(
            (point) => [point.lng, point.lat] as [number, number],
          );

          // Procesar ruta con map matching (una sola vez por ruta)
          const processedRoute = await processRouteWithCoordinates(
            originalCoordinates,
            apiKey,
            shouldApplyMapMatching,
          );

          const routeGeoJSON = {
            type: 'Feature' as const,
            properties: {},
            geometry: processedRoute.matchedGeometry,
          };

          // Dibujar una capa por cada compañía única en esta ruta
          const uniqueCompanies = new Map<
            string,
            { busId: string; companyId: string }
          >();
          busesOnRoute.forEach((bus) => {
            if (!uniqueCompanies.has(bus.companyId)) {
              uniqueCompanies.set(bus.companyId, bus);
            }
          });

          // Convertir a array para poder indexar
          const companiesArray = Array.from(uniqueCompanies.values());
          const totalCompanies = companiesArray.length;

          companiesArray.forEach((bus, companyIndex) => {
            const sourceId = `route-${route.variant_id}-company-${bus.companyId}`;
            const layerId = sourceId;
            routeLayersIds.current.add(layerId);

            // Color según la empresa del bus
            const color = getCompanyColor(
              bus.companyId,
              companyMap,
              companyColorMap,
            );

            // Calcular offset lateral para rutas compartidas
            // Si hay múltiples compañías, distribuir las líneas lateralmente
            let lineOffset = 0;
            if (totalCompanies > 1) {
              // Desplazamiento de -2 a +2 metros por compañía
              const offsetRange = 4; // rango total en metros
              const step = offsetRange / (totalCompanies - 1);
              lineOffset = companyIndex * step - offsetRange / 2;
            }

            // Opacidad inicial
            const opacity = 0.7;

            // Agregar source y layer para esta combinación ruta-compañía
            mapInstance.current!.addSource(sourceId, {
              type: 'geojson',
              data: routeGeoJSON,
            });

            mapInstance.current!.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': color,
                'line-width': 3,
                'line-opacity': opacity,
                'line-offset': lineOffset, // Offset lateral para rutas compartidas
              },
            });
          });
        } catch (error) {
          console.error(`Error drawing route ${route.variant_id}:`, error);
        }
      }
    };

    drawAllRoutes();
  }, [routeVariants, busPositions, mapReady, companyColorMap, companyMap]);

  // Actualizar opacidad de rutas cuando cambia la selección
  useEffect(() => {
    if (!mapInstance.current || routeLayersIds.current.size === 0) return;

    // Obtener el company_id del bus seleccionado
    let selectedBusCompanyId: string | null = null;
    if (selectedBusId) {
      const selectedBusPosition = busPositions.find(
        (pos) => pos.bus_id === selectedBusId,
      );
      if (selectedBusPosition) {
        selectedBusCompanyId = selectedBusPosition.company_id;
      }
    }

    // Actualizar opacidad de todas las rutas
    routeLayersIds.current.forEach((layerId) => {
      if (!mapInstance.current!.getLayer(layerId)) return;

      // Extraer el companyId del layerId (formato: route-{variant_id}-company-{companyId})
      const companyId = layerId.split('-company-')[1];

      // Determinar opacidad
      // Si no hay bus seleccionado, todas las rutas al 70%
      // Si hay bus seleccionado, resaltar solo la ruta de su compañía
      const isCompanySelected = selectedBusCompanyId === companyId;
      const opacity = selectedBusId === null || isCompanySelected ? 0.7 : 0.2;

      // Actualizar opacidad
      mapInstance.current!.setPaintProperty(layerId, 'line-opacity', opacity);
    });
  }, [selectedBusId, busPositions]);

  // Actualizar marcadores de vehículos
  useEffect(() => {
    console.log('🎨 [HomePage] Vehicle markers effect triggered');
    console.log('🎨 [HomePage] Map ready:', !!mapInstance.current);
    console.log('🎨 [HomePage] Vehicles count:', vehicles.length);
    console.log('🎨 [HomePage] Bus positions count:', busPositions.length);

    // DEBUG: Mostrar los IDs para comparar
    if (vehicles.length > 0 && busPositions.length > 0) {
      console.log(
        '🔍 [HomePage] Vehicle IDs:',
        vehicles.map((v) => v.id),
      );
      console.log(
        '🔍 [HomePage] Bus Position IDs:',
        busPositions.map((p) => p.bus_id),
      );
      console.log('🔍 [HomePage] First vehicle details:', vehicles[0]);
      console.log('🔍 [HomePage] First position details:', busPositions[0]);
      console.log(
        '🔍 [HomePage] First position location_json:',
        busPositions[0]?.location_json,
      );
      console.log(
        '🔍 [HomePage] Type of location_json:',
        typeof busPositions[0]?.location_json,
      );
    }

    if (!mapInstance.current) {
      console.log('❌ [HomePage] Map not ready yet, skipping markers');
      return;
    }

    console.log('🧹 [HomePage] Clearing existing markers...');
    // Limpiar marcadores existentes
    vehicleMarkers.current.forEach((marker) => marker.remove());
    vehicleMarkers.current.clear();

    let markersAdded = 0;

    // IMPORTANTE: Iterar sobre busPositions directamente, no sobre vehicles
    // porque busPositions tiene la información de location_json
    busPositions.forEach((position) => {
      if (!position.location_json) {
        console.log(
          `⚠️ [HomePage] Position for bus ${position.plate} (${position.bus_id}) - No location_json`,
        );
        return;
      }

      const { lat, lng } = position.location_json;
      console.log(
        `✅ [HomePage] Adding marker for ${position.plate} at [${lat}, ${lng}]`,
      );

      // Obtener color según la compañía
      const color = getCompanyColor(
        position.company_id,
        companyMap,
        companyColorMap,
      );

      // Determinar opacidad basada en selección
      const isSelected = selectedBusId === position.bus_id;
      const opacity = selectedBusId === null || isSelected ? '1' : '0.3';

      // Crear elemento del marcador
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          opacity: ${opacity};
          transition: opacity 0.3s ease;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="white" viewBox="0 0 256 256">
            <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z" />
          </svg>
        </div>
      `;

      // Agregar click handler para seleccionar el bus y centrar en la ruta
      element.addEventListener('click', () => {
        const newSelectedId =
          selectedBusId === position.bus_id ? null : position.bus_id;
        setSelectedBusId(newSelectedId);

        // Si se seleccionó un bus (no se deseleccionó)
        if (newSelectedId) {
          // Si el bus tiene ruta activa, centrar en toda la ruta
          if (position.active_route_variant_id) {
            const route = routeVariants.find(
              (r) => r.variant_id === position.active_route_variant_id,
            );
            if (route && mapInstance.current) {
              // Calcular bounds de toda la ruta
              const coordinates = route.path.map(
                (point) => [point.lng, point.lat] as [number, number],
              );

              if (coordinates.length > 0) {
                const bounds = coordinates.reduce(
                  (bounds, coord) => bounds.extend(coord),
                  new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
                );

                mapInstance.current.fitBounds(bounds, {
                  padding: { top: 100, bottom: 100, left: 100, right: 100 },
                  duration: 1500,
                });
              }
            }
          } else {
            // Si no tiene ruta, solo centrar en el bus
            if (mapInstance.current) {
              mapInstance.current.flyTo({
                center: [lng, lat],
                zoom: 16,
                duration: 1500,
              });
            }
          }
        }
      });

      const marker = new maplibregl.Marker({
        element,
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current!);

      // Buscar información de la compañía
      const company = companies.find((c) => c.id === position.company_id);
      const companyName = company
        ? company.short_name || company.name
        : 'Sin compañía';

      // Agregar popup con información del vehículo
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${position.plate}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Compañía: ${companyName}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Ruta: ${position.active_route_variant_id || 'Sin ruta'}</p>
            ${position.speed_kph !== undefined ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">Velocidad: ${position.speed_kph.toFixed(1)} km/h</p>` : ''}
          </div>
        `);

      marker.setPopup(popup);

      vehicleMarkers.current.set(position.bus_id, marker);
      markersAdded++;
    });

    console.log(
      `🎉 [HomePage] Successfully added ${markersAdded} markers to map`,
    );
    console.log(
      `📊 [HomePage] Total markers in map: ${vehicleMarkers.current.size}`,
    );
  }, [
    vehicles,
    busPositions,
    companyColorMap,
    companyMap,
    selectedBusId,
    companies,
    routeVariants,
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

  const handleCompassMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDraggingCompass(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        bearing: mapBearing,
      });
    },
    [mapBearing],
  );

  const handleCompassMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingCompass || !dragStart || !mapInstance.current) return;

      const deltaX = e.clientX - dragStart.x;
      const newBearing = dragStart.bearing - deltaX * 0.5;
      mapInstance.current.setBearing(newBearing);
    },
    [isDraggingCompass, dragStart],
  );

  const handleCompassMouseUp = useCallback(() => {
    setIsDraggingCompass(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (isDraggingCompass) {
      document.addEventListener('mousemove', handleCompassMouseMove);
      document.addEventListener('mouseup', handleCompassMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleCompassMouseMove);
        document.removeEventListener('mouseup', handleCompassMouseUp);
      };
    }
  }, [isDraggingCompass, handleCompassMouseMove, handleCompassMouseUp]);

  const handleResetNorth = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.easeTo({ bearing: 0, duration: 300 });
  }, []);

  // Filtros de tiempo
  const timeFilters: FilterOption<'24h' | '7d' | '30d'>[] = [
    { id: '24h', label: '24 horas', icon: 'ri-time-line' },
    { id: '7d', label: '7 días', icon: 'ri-calendar-line' },
    { id: '30d', label: '30 días', icon: 'ri-calendar-2-line' },
  ];
  const [activeTimeFilter, setActiveTimeFilter] = useState<
    '24h' | '7d' | '30d'
  >('24h');

  return (
    <>
      <PageHeader title="Dashboard" />

      <div className={`p-6 ${colorClasses.bgPage}`}>
        {/* Filtros de tiempo */}
        <div className="mb-6">
          <R2MFilterSwitcher
            options={timeFilters}
            activeFilter={activeTimeFilter}
            onFilterChange={(filter) => filter && setActiveTimeFilter(filter)}
            allowDeselect={false}
          />
        </div>

        {/* KPIs */}
        <h2
          className={`${colorClasses.textPrimary} text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5`}
        >
          Indicadores Clave de Desempeño
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div
            className={`flex flex-col gap-2 rounded-xl p-6 bg-white border ${colorClasses.borderSurface} shadow-sm hover:shadow-md transition-shadow`}
          >
            <p
              className={`${colorClasses.textTerciary} text-sm font-medium leading-normal`}
            >
              Buses Activos
            </p>
            <p
              className={`${colorClasses.textPrimary} tracking-tight text-3xl font-bold leading-tight`}
            >
              {busPositions.length}
            </p>
          </div>

          <div
            className={`flex flex-col gap-2 rounded-xl p-6 bg-white border ${colorClasses.borderSurface} shadow-sm hover:shadow-md transition-shadow`}
          >
            <p
              className={`${colorClasses.textTerciary} text-sm font-medium leading-normal`}
            >
              Rutas en Servicio
            </p>
            <p
              className={`${colorClasses.textPrimary} tracking-tight text-3xl font-bold leading-tight`}
            >
              {activeRoutesCount}
            </p>
          </div>

          <div
            className={`flex flex-col gap-2 rounded-xl p-6 bg-white border ${colorClasses.borderSurface} shadow-sm hover:shadow-md transition-shadow`}
          >
            <p
              className={`${colorClasses.textTerciary} text-sm font-medium leading-normal`}
            >
              Total de Vehículos
            </p>
            <p
              className={`${colorClasses.textPrimary} tracking-tight text-3xl font-bold leading-tight`}
            >
              {vehicles.length}
            </p>
          </div>
        </div>

        {/* Mapa de Flota */}
        <h2
          className={`${colorClasses.textPrimary} text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5`}
        >
          Mapa en Tiempo Real
        </h2>
        <div className="py-3 flex gap-4">
          {/* Panel de Información del Vehículo Seleccionado */}
          {selectedBusId &&
            (() => {
              const selectedVehicle = vehicles.find(
                (v) => v.id === selectedBusId,
              );
              const selectedPosition = busPositions.find(
                (pos) => pos.bus_id === selectedBusId,
              );
              const selectedCompany = selectedPosition
                ? companies.find((c) => c.id === selectedPosition.company_id)
                : null;
              const selectedRoute = selectedPosition?.active_route_variant_id
                ? routeVariants.find(
                    (r) =>
                      r.variant_id === selectedPosition.active_route_variant_id,
                  )
                : null;

              if (!selectedVehicle) return null;

              return (
                <div className="w-80 flex-shrink-0">
                  <div className="bg-white rounded-xl border shadow-sm p-4 sticky top-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`${colorClasses.textPrimary} text-lg font-bold`}
                      >
                        Información del Bus
                      </h3>
                      <button
                        onClick={() => setSelectedBusId(null)}
                        className={`p-1 rounded-lg hover:${colorClasses.bgSurface} transition-colors`}
                        title="Cerrar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="currentColor"
                          viewBox="0 0 256 256"
                        >
                          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p
                          className={`${colorClasses.textSecondary} text-xs font-medium uppercase mb-1`}
                        >
                          Placa
                        </p>
                        <p
                          className={`${colorClasses.textPrimary} text-xl font-bold`}
                        >
                          {selectedVehicle.plate}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`${colorClasses.textSecondary} text-xs font-medium uppercase mb-1`}
                        >
                          Compañía
                        </p>
                        <p
                          className={`${colorClasses.textPrimary} text-sm font-medium`}
                        >
                          {selectedCompany
                            ? selectedCompany.short_name || selectedCompany.name
                            : 'Sin compañía'}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`${colorClasses.textSecondary} text-xs font-medium uppercase mb-1`}
                        >
                          Estado
                        </p>
                        <p
                          className={`${colorClasses.textPrimary} text-sm font-medium`}
                        >
                          {getVehicleDisplayStatus(selectedVehicle.status)}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`${colorClasses.textSecondary} text-xs font-medium uppercase mb-1`}
                        >
                          Capacidad
                        </p>
                        <p
                          className={`${colorClasses.textPrimary} text-sm font-medium`}
                        >
                          {selectedVehicle.capacity} pasajeros
                        </p>
                      </div>

                      {selectedPosition && (
                        <>
                          <div>
                            <p
                              className={`${colorClasses.textSecondary} text-xs font-medium uppercase mb-1`}
                            >
                              Velocidad
                            </p>
                            <p
                              className={`${colorClasses.textPrimary} text-sm font-medium`}
                            >
                              {selectedPosition.speed_kph !== undefined
                                ? `${selectedPosition.speed_kph.toFixed(1)} km/h`
                                : 'N/A'}
                            </p>
                          </div>

                          {selectedRoute && (
                            <div>
                              <p
                                className={`${colorClasses.textSecondary} text-xs font-medium uppercase mb-1`}
                              >
                                Ruta Actual
                              </p>
                              <p
                                className={`${colorClasses.textPrimary} text-sm font-medium`}
                              >
                                {selectedRoute.route_code} -{' '}
                                {selectedRoute.route_name}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Contenedor del Mapa */}
          <div className="flex-1">
            <div
              className="rounded-xl relative shadow-lg"
              style={{
                backgroundColor: '#e5e7eb',
                height: '500px',
                width: '100%',
              }}
            >
              {/* Controles del Mapa */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {/* Zoom Controls */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={handleZoomIn}
                    className={`flex size-10 items-center justify-center rounded-t-xl bg-white shadow-md hover:${colorClasses.bgSurface} transition-colors`}
                    title="Acercar"
                  >
                    <RiAddLine size={20} className={colorClasses.textPrimary} />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className={`flex size-10 items-center justify-center rounded-b-xl bg-white shadow-md hover:${colorClasses.bgSurface} transition-colors`}
                    title="Alejar"
                  >
                    <RiSubtractLine
                      size={20}
                      className={colorClasses.textPrimary}
                    />
                  </button>
                </div>

                {/* Compass Control */}
                <div className="relative">
                  <button
                    onMouseDown={handleCompassMouseDown}
                    onDoubleClick={handleResetNorth}
                    className={`flex size-10 items-center justify-center rounded-xl bg-white shadow-md hover:${colorClasses.bgSurface} transition-colors cursor-grab active:cursor-grabbing`}
                    style={{
                      transform: `rotate(${-mapBearing}deg)`,
                    }}
                    title="Rotar mapa (doble clic para restablecer norte)"
                  >
                    <RiCompassLine
                      size={20}
                      className={colorClasses.textPrimary}
                    />
                  </button>
                </div>
              </div>

              {/* Mapa */}
              <div
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
                className="rounded-xl"
              />

              {/* Indicador de carga */}
              {!mapReady && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <GlobalLoader />
                </div>
              )}
            </div>

            {/* Leyenda de Colores por Organización */}
            {companies.length > 0 && (
              <div
                className={`mt-4 p-4 bg-white rounded-xl border ${colorClasses.borderSurface} shadow-sm`}
              >
                <p
                  className={`${colorClasses.textPrimary} text-sm font-semibold mb-3`}
                >
                  Organizaciones
                </p>
                <div className="flex flex-wrap gap-3">
                  {companies.map((company) => {
                    const color = companyColorMap.get(company.id) || '#64748b';
                    return (
                      <div
                        key={company.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span
                          className={`text-xs font-medium ${colorClasses.textPrimary}`}
                        >
                          {company.short_name || company.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
