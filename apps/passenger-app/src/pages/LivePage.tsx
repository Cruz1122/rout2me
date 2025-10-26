import { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { IoSearch, IoSearchOutline } from 'react-icons/io5';
import {
  RiBusLine,
  RiBusFill,
  RiRoadMapLine,
  RiRoadMapFill,
  RiGridLine,
  RiGridFill,
} from 'react-icons/ri';
import {
  type Bus,
  fetchBuses,
  type BusServiceError,
} from '../services/busService';
import FilterSwitcher, {
  type FilterOption,
} from '../components/FilterSwitcher';
import {
  getDistanceBetweenLocations,
  formatDistance,
} from '../utils/distanceUtils';
import { useUserLocation } from '../hooks/useUserLocation';
import { getNearbyBuses } from '../utils/busUtils';
import GlobalLoader from '../components/GlobalLoader';

type FilterTab = 'all' | 'active' | 'nearby';

const FILTER_OPTIONS: readonly FilterOption<FilterTab>[] = [
  {
    id: 'all',
    label: 'Todos',
    iconOutline: RiGridLine,
    iconFilled: RiGridFill,
  },
  {
    id: 'active',
    label: 'Activos',
    iconOutline: RiBusLine,
    iconFilled: RiBusFill,
  },
  {
    id: 'nearby',
    label: 'Cercanos',
    iconOutline: RiRoadMapLine,
    iconFilled: RiRoadMapFill,
  },
] as const;

export default function LivePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BusServiceError | null>(null);
  const userLocation = useUserLocation();

  // Cargar buses al montar el componente
  useEffect(() => {
    const loadBuses = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedBuses = await fetchBuses();
        setBuses(fetchedBuses);
      } catch (err) {
        console.error('Error loading buses:', err);
        setError(err as BusServiceError);
      } finally {
        setLoading(false);
      }
    };

    loadBuses();
  }, []);

  const handleFilterChange = (filter: FilterTab | null) => {
    setActiveFilter(filter);
  };

  const getFilteredBuses = (): Bus[] => {
    let filteredBuses = buses;

    // Aplicar filtro de categoría (no excluyentes)
    if (activeFilter === 'active') {
      // Activos solo muestra buses que no estén offline
      filteredBuses = filteredBuses.filter((bus) => bus.status !== 'offline');
    } else if (activeFilter === 'nearby' && userLocation) {
      // Cercanos calcula dinámicamente basado en la ubicación del usuario
      filteredBuses = getNearbyBuses(filteredBuses, userLocation);
    }

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      filteredBuses = filteredBuses.filter(
        (bus) =>
          bus.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.plate?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filteredBuses;
  };

  const filteredBuses = getFilteredBuses();

  const renderBusesContent = () => {
    if (loading) {
      return <GlobalLoader />;
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-500">
          <p className="mb-2">Error al cargar los buses</p>
          <p className="text-sm text-gray-500">{error.message}</p>
          <button
            onClick={() => globalThis.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (filteredBuses.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>No se encontraron buses</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredBuses.map((bus) => (
          <BusCard key={bus.id} bus={bus} userLocation={userLocation} />
        ))}
      </div>
    );
  };

  return (
    <IonPage>
      <IonContent>
        {/* Header fijo */}
        <div
          className="sticky top-0 z-50 bg-white backdrop-blur-lg"
          style={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="flex items-center justify-center h-14">
            <h1
              className="text-xl font-bold text-center"
              style={{ color: 'var(--color-primary)' }}
            >
              Buses en tiempo real
            </h1>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="px-4 pt-4 pb-3 bg-white">
          {/* Barra de búsqueda */}
          <div className="relative mb-3">
            <div
              className="relative flex items-center transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(var(--color-surface-rgb), 0.3)',
                borderRadius: '16px',
              }}
            >
              {/* Search Icon */}
              <div
                className="absolute left-4 transition-all duration-300"
                style={{
                  color:
                    isSearchFocused || searchQuery
                      ? 'rgb(var(--color-primary-rgb))'
                      : 'rgb(107, 114, 128)',
                }}
              >
                {isSearchFocused || searchQuery ? (
                  <IoSearch size={20} />
                ) : (
                  <IoSearchOutline size={20} />
                )}
              </div>

              {/* Input Field */}
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Buscar bus por ruta o placa..."
                className="w-full h-12 pl-12 pr-4 bg-transparent focus:outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Filtros tipo switch con iconos animados */}
          <FilterSwitcher
            options={FILTER_OPTIONS}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            allowDeselect={true}
          />
        </div>

        {/* Lista de buses */}
        <div className="px-4 py-2">{renderBusesContent()}</div>
      </IonContent>
    </IonPage>
  );
}

interface BusCardProps {
  readonly bus: Bus;
  readonly userLocation: { latitude: number; longitude: number } | null;
}

function BusCard({ bus, userLocation }: BusCardProps) {
  // Calcular distancia en tiempo real (solo si el bus tiene ubicación Y el usuario también)
  const canCalculateDistance = bus.location !== null && userLocation !== null;
  const distance = canCalculateDistance
    ? getDistanceBetweenLocations(userLocation!, bus.location!)
    : Infinity;
  const isNearby =
    bus.status !== 'offline' && canCalculateDistance && distance <= 1.5; // 1.5 km threshold

  // Determinar estado dinámico basado en la distancia
  const getDynamicStatus = (): Bus['status'] => {
    if (bus.status === 'offline') return 'offline';
    if (isNearby) return 'nearby';
    return 'active';
  };

  const dynamicStatus = getDynamicStatus();

  const getOccupancyColor = (occupancy: Bus['occupancy']) => {
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
  };

  const getStatusColor = (status: Bus['status']) => {
    switch (status) {
      case 'active':
        return 'var(--color-secondary)';
      case 'nearby':
        return '#10B981';
      case 'offline':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: Bus['status']) => {
    switch (status) {
      case 'active':
        return 'En línea';
      case 'nearby':
        return 'Cercano';
      case 'offline':
        return 'Inactivo';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Badge del bus */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
          style={{
            backgroundColor: getStatusColor(dynamicStatus),
          }}
        >
          <RiBusLine size={24} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Título con número de ruta */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3
                className="font-semibold text-sm leading-tight"
                style={{
                  color: dynamicStatus === 'offline' ? '#9CA3AF' : 'inherit',
                }}
              >
                {bus.plate} - {bus.routeName}
              </h3>
              {bus.routeNumber && bus.routeNumber !== 'N/A' && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Ruta: {bus.routeNumber}
                </p>
              )}
            </div>
            <span
              className="text-xs font-medium px-2 py-1 rounded flex-shrink-0"
              style={{
                backgroundColor: `${getStatusColor(dynamicStatus)}20`,
                color: getStatusColor(dynamicStatus),
              }}
            >
              {getStatusLabel(dynamicStatus)}
            </span>
          </div>

          {/* Información adicional */}
          <p
            className="text-xs text-gray-500"
            style={{ marginBottom: dynamicStatus === 'offline' ? 0 : '0.5rem' }}
          >
            {dynamicStatus === 'offline'
              ? 'Fuera de servicio'
              : !userLocation
                ? 'Permite acceso a ubicación'
                : !bus.location
                  ? 'Sin ubicación disponible'
                  : formatDistance(distance)}
          </p>

          {/* Ocupación */}
          {dynamicStatus !== 'offline' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Ocupación</span>
                <span
                  className="font-medium"
                  style={{ color: getOccupancyColor(bus.occupancy) }}
                >
                  {bus.currentCapacity}/{bus.maxCapacity} pasajeros
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(bus.currentCapacity / bus.maxCapacity) * 100}%`,
                      backgroundColor: getOccupancyColor(bus.occupancy),
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium min-w-[60px] text-right"
                  style={{ color: getOccupancyColor(bus.occupancy) }}
                >
                  {Math.round((bus.currentCapacity / bus.maxCapacity) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
