import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
  useMemo,
} from 'react';
import { colorClasses } from '../styles/colors';
import GlobalLoader from '../components/GlobalLoader';
import PageHeader from '../components/PageHeader';
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

  // Referencias para el mapa
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MlMap | null>(null);
  const vehicleMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const routeLayersIds = useRef<Set<string>>(new Set());
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

  // Cargar datos iniciales
  useEffect(() => {
    const initializeData = async () => {
      const myVehicles = await loadVehicles(); // Cargar primero los vehículos de mi org
      await loadBusPositions(myVehicles); // Luego filtrar posiciones por mis vehículos
      await loadRouteVariants();
      await loadCompanies();
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

      // Usar los vehículos pasados como parámetro o los de la ref actualizada
      const vehiclesToFilter = myVehicles || vehiclesRef.current;

      if (vehiclesToFilter.length === 0) {
        console.warn('No vehicles loaded yet, skipping position filter');
        return;
      }

      const myBusIds = new Set(vehiclesToFilter.map((v) => v.id));
      const filteredPositions = data.filter((pos) => myBusIds.has(pos.bus_id));

      setBusPositions(filteredPositions);
    } catch (error) {
      console.error('Error loading bus positions:', error);
    }
  }, []); // Sin dependencias porque usa vehiclesRef

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
    if (!mapInstance.current) return;

    // Limpiar marcadores existentes
    vehicleMarkers.current.forEach((marker) => marker.remove());
    vehicleMarkers.current.clear();

    // Agregar marcadores para cada vehículo con posición
    vehicles.forEach((vehicle) => {
      const position = busPositions.find((pos) => pos.bus_id === vehicle.id);

      if (!position || !position.location_json) return;

      const { lat, lng } = position.location_json;

      // Obtener color según la compañía (usar company_id de position, no de vehicle)
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

      // Agregar click handler para seleccionar el bus
      element.addEventListener('click', () => {
        setSelectedBusId(
          selectedBusId === position.bus_id ? null : position.bus_id,
        );
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
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${vehicle.plate}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Compañía: ${companyName}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Ruta: ${position.active_route_variant_id || 'Sin ruta'}</p>
            ${position.speed_kph !== undefined ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">Velocidad: ${position.speed_kph.toFixed(1)} km/h</p>` : ''}
          </div>
        `);

      marker.setPopup(popup);

      vehicleMarkers.current.set(vehicle.id, marker);
    });
  }, [
    vehicles,
    busPositions,
    companyColorMap,
    companyMap,
    selectedBusId,
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

  return (
    <>
      <PageHeader title="Dashboard" />

      <div className="p-6">
        {/* Main content */}
        <div className="flex gap-3 flex-wrap">
          {['24h', '7d', '30d'].map((t) => (
            <div
              key={t}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl ${colorClasses.bgSurface} pl-4 pr-4`}
            >
              <p
                className={`${colorClasses.textPrimary} text-sm font-medium leading-normal`}
              >
                {t}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-3 flex-wrap pr-4">
          <div
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl ${colorClasses.bgSurface} pl-4 pr-4`}
          >
            <p
              className={`${colorClasses.textPrimary} text-sm font-medium leading-normal`}
            >
              Filtros Guardados
            </p>
          </div>
        </div>

        {/* KPIs */}
        <h2
          className={`${colorClasses.textPrimary} text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5`}
        >
          Indicadores Clave de Desempeño
        </h2>
        <div className="flex flex-wrap gap-4 p-4">
          {[
            {
              title: 'Buses Activos',
              val: busPositions.length.toString(),
              delta: '+10%',
              deltaColor: '#07883b',
            },
            {
              title: 'Ocupación Promedio %',
              val: '0%',
              delta: '-5%',
              deltaColor: '#e73908',
            },
            {
              title: 'Rutas en Servicio',
              val: activeRoutesCount.toString(),
              delta: '+20%',
              deltaColor: '#07883b',
            },
            {
              title: 'Incidentes Abiertos',
              val: '5',
              delta: '-2',
              deltaColor: '#e73908',
            },
            {
              title: 'Tasa de Puntualidad %',
              val: '98%',
              delta: '+1%',
              deltaColor: '#07883b',
            },
            {
              title: 'Actualización Telemetría',
              val: '5 min',
              delta: '-1 min',
              deltaColor: '#e73908',
            },
          ].map((k) => (
            <div
              key={k.title}
              className={`flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border ${colorClasses.borderSurface}`}
            >
              <p
                className={`${colorClasses.textPrimary} text-base font-medium leading-normal`}
              >
                {k.title}
              </p>
              <p
                className={`${colorClasses.textPrimary} tracking-light text-2xl font-bold leading-tight`}
              >
                {k.val}
              </p>
              <p
                className="text-base font-medium leading-normal"
                style={{ color: k.deltaColor }}
              >
                {k.delta}
              </p>
            </div>
          ))}
        </div>

        {/* Trends */}
        <h2
          className={`${colorClasses.textPrimary} text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5`}
        >
          Tendencias
        </h2>
        <div className="flex flex-wrap gap-4 px-4 py-6">
          <div
            className={`flex min-w-72 flex-1 flex-col gap-2 rounded-xl border ${colorClasses.borderSurface} p-6`}
          >
            <p
              className={`${colorClasses.textPrimary} text-base font-medium leading-normal`}
            >
              Ocupación en el Tiempo
            </p>
            <div className="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
              <svg
                width="100%"
                height="148"
                viewBox="-3 0 478 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z"
                  fill="url(#paint0_linear_1131_5935)"
                />
                <path
                  d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                  stroke="#646f87"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_1131_5935"
                    x1="236"
                    y1="1"
                    x2="236"
                    y2="149"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#f0f2f4" />
                    <stop offset="1" stopColor="#f0f2f4" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-around text-[#646f87] text-[13px] font-bold tracking-[0.015em]">
                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map((m) => (
                  <p key={m}>{m}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Bars */}
          <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#dcdfe5] p-6">
            <p className="text-[#111317] text-base font-medium leading-normal">
              Utilización por Ruta
            </p>
            <div className="grid min-h-[180px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center px-3">
              {[
                { h: '80%', label: 'Ruta A' },
                { h: '40%', label: 'Ruta B' },
                { h: '60%', label: 'Ruta C' },
              ].map((b) => (
                <Fragment key={b.label}>
                  <div
                    className="border-[#646f87] bg-[#f0f2f4] border-t-2 w-full"
                    style={{ height: b.h }}
                  ></div>
                  <p className="text-[#646f87] text-[13px] font-bold leading-normal tracking-[0.015em]">
                    {b.label}
                  </p>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#dcdfe5] p-6">
            <p className="text-[#111317] text-base font-medium leading-normal">
              Incidentes por Tipo
            </p>
            <div className="grid min-h-[180px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center px-3">
              {[
                { h: '40%', label: 'Tipo A' },
                { h: '30%', label: 'Tipo B' },
                { h: '90%', label: 'Tipo C' },
              ].map((b) => (
                <Fragment key={b.label}>
                  <div
                    className="border-[#646f87] bg-[#f0f2f4] border-t-2 w-full"
                    style={{ height: b.h }}
                  ></div>
                  <p className="text-[#646f87] text-[13px] font-bold leading-normal tracking-[0.015em]">
                    {b.label}
                  </p>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Mapa de Flota */}
        <h2
          className={`${colorClasses.textPrimary} text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5`}
        >
          Conciencia Situacional
        </h2>
        <div className="px-4 py-3">
          <div
            className="@[480px]:rounded-xl relative"
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
              <div className="relative">
                <button
                  onMouseDown={handleCompassMouseDown}
                  onDoubleClick={handleResetNorth}
                  className="flex size-10 items-center justify-center rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing"
                  style={{
                    transform: `rotate(${-mapBearing}deg)`,
                  }}
                >
                  <RiCompassLine size={20} className="text-[#111317]" />
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
          <div className="mt-4 p-4 bg-white rounded-xl border border-[#dcdfe5]">
            <p
              className={`${colorClasses.textPrimary} text-sm font-medium mb-2`}
            >
              Colores por Organización
            </p>
            <div className="flex flex-wrap gap-3">
              {/* Mostrar organizaciones reales con sus colores */}
              {companies.map((company) => {
                const color = companyColorMap.get(company.id) || '#64748b';
                return (
                  <div key={company.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-xs text-[#646f87]">
                      {company.short_name || company.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Principales Retrasos / Riesgos SLA
        </h2>
        <div className="px-4 py-3 [container-type:inline-size]">
          <div className="flex overflow-hidden rounded-xl border border-[#dcdfe5] bg-white">
            <table className="flex-1">
              <thead>
                <tr className="bg-white">
                  <th className="table-col-120 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                    Ruta
                  </th>
                  <th className="table-col-240 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                    % A Tiempo
                  </th>
                  <th className="table-col-360 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                    Retraso Promedio
                  </th>
                  <th className="table-col-480 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                    Vehículos Afectados
                  </th>
                  <th className="table-col-600 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                    Tendencia
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Ruta A', '95%', '5 min', '2', 'Aumentando'],
                  ['Ruta B', '90%', '10 min', '3', 'Disminuyendo'],
                  ['Ruta C', '85%', '15 min', '1', 'Estable'],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-t-[#dcdfe5]">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`h-[72px] px-4 py-2 w-[400px] text-sm font-normal leading-normal ${j === 0 ? 'text-[#111317]' : 'text-[#646f87]'} table-col-${(j + 1) * 120}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style>{`
          @container(max-width:120px){.table-col-120{display:none}}
          @container(max-width:240px){.table-col-240{display:none}}
          @container(max-width:360px){.table-col-360{display:none}}
          @container(max-width:480px){.table-col-480{display:none}}
          @container(max-width:600px){.table-col-600{display:none}}
        `}</style>
        </div>

        {/* Severity */}
        <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Incidentes Abiertos por Severidad
        </h2>
        <div className="flex flex-wrap gap-4 px-4 py-6">
          <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#dcdfe5] p-6">
            <p className="text-[#111317] text-base font-medium leading-normal">
              Incidentes por Severidad
            </p>
            <div className="grid min-h-[180px] gap-x-4 gap-y-6 grid-cols-[auto_1fr] items-center py-3">
              {[
                ['Alta', '50%'],
                ['Media', '90%'],
                ['Baja', '80%'],
              ].map(([label, width]) => (
                <Fragment key={label}>
                  <p className="text-[#646f87] text-[13px] font-bold leading-normal tracking-[0.015em]">
                    {label}
                  </p>
                  <div className="h-full flex-1">
                    <div
                      className="border-[#646f87] bg-[#f0f2f4] border-r-2 h-full"
                      style={{ width }}
                    ></div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {[
          {
            title: 'Incidente: Falla del Motor',
            sub1: 'Severidad Alta',
            sub2: 'Vehículo 123 - Ruta A',
          },
          {
            title: 'Incidente: Accidente',
            sub1: 'Severidad Media',
            sub2: 'Vehículo 456 - Ruta B',
          },
          {
            title: 'Incidente: Retraso Menor',
            sub1: 'Severidad Baja',
            sub2: 'Vehículo 789 - Ruta C',
          },
        ].map((i, idx) => (
          <div key={idx} className="flex gap-4 bg-white px-4 py-3">
            <div className="text-[#111317] flex items-center justify-center rounded-lg bg-[#f0f2f4] shrink-0 size-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"></path>
              </svg>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-[#111317] text-base font-medium leading-normal">
                {i.title}
              </p>
              <p className="text-[#646f87] text-sm font-normal leading-normal">
                {i.sub1}
              </p>
              <p className="text-[#646f87] text-sm font-normal leading-normal">
                {i.sub2}
              </p>
            </div>
          </div>
        ))}

        {/* Gauges (simple cards) */}
        <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Indicadores de Salud de la Flota
        </h2>
        <div className="flex flex-wrap gap-4 p-4">
          {[
            ['Tiempo Activo', '99.9%'],
            ['% Señal GPS OK', '98%'],
            ['Frescura Datos P95', '2 min'],
          ].map(([title, val]) => (
            <div
              key={title}
              className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dcdfe5]"
            >
              <p className="text-[#111317] text-base font-medium leading-normal">
                {title}
              </p>
              <p className="text-[#111317] tracking-light text-2xl font-bold leading-tight">
                {val}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Acciones Rápidas
        </h2>
        <div className="flex justify-stretch">
          <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#1d56c9] text-white text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Crear Incidente</span>
            </button>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Asignar Vehículos a Ruta</span>
            </button>
          </div>
        </div>

        <div className="flex justify-stretch">
          <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Exportar Reporte Diario</span>
            </button>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Programar Reporte</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
