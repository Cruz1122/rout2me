import { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { IoSearch, IoSearchOutline } from 'react-icons/io5';
import {
  RiBusLine,
  RiBusFill,
  RiRoadMapLine,
  RiRoadMapFill,
  RiGridLine,
  RiGridFill,
  RiMapPinLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import {
  type Bus,
  fetchBuses,
  type BusServiceError,
} from '../services/busService';
import { generateRouteColor } from '../services/routeService';
import FilterSwitcher, {
  type FilterOption,
} from '../components/FilterSwitcher';
import {
  getDistanceBetweenLocations,
  formatDistance,
} from '../../../shared/utils/distanceUtils';
import { useUserLocation } from '../../system/hooks/useUserLocation';
import { getNearbyBuses } from '../utils/busUtils';
import GlobalLoader from '../../system/components/GlobalLoader';
import R2MModal from '../../../shared/components/R2MModal';
import R2MButton from '../../../shared/components/R2MButton';
import R2MPageHeader from '../../../shared/components/R2MPageHeader';
import { useTheme } from '../../../contexts/ThemeContext';

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

export default function BusesPage() {
  const router = useIonRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BusServiceError | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showBusModal, setShowBusModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const userLocation = useUserLocation();

  // Resetear el estado de navegación cuando se vuelve a la página
  useIonViewDidEnter(() => {
    setIsNavigating(false);
  });

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

  const handleBusClick = (bus: Bus) => {
    setSelectedBus(bus);
    setShowBusModal(true);
  };

  const handleViewBusOnMap = async () => {
    if (!selectedBus) return;

    // Mostrar loader mientras se procesa
    setIsNavigating(true);

    try {
      // Navegar a HomePage con el bus seleccionado
      const busData = {
        id: selectedBus.activeRouteVariantId || selectedBus.routeNumber,
        code: selectedBus.routeNumber,
        name: selectedBus.routeName,
        busId: selectedBus.id,
        busLocation: selectedBus.location,
      };

      // Guardar en el estado global para que HomePage pueda acceder
      (globalThis as { busData?: typeof busData }).busData = busData;

      setShowBusModal(false);
      setSelectedBus(null);

      // Navegar a HomePage usando Ionic Router (sin recargar la página)
      // El loader se mantendrá hasta que HomePage complete el procesamiento
      await router.push('/inicio', 'forward', 'push');
    } catch (error) {
      console.error('Error navigating to map:', error);
      setIsNavigating(false);
    }
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

    // Ordenar por distancia ascendente
    if (userLocation) {
      filteredBuses = filteredBuses.sort((busA, busB) => {
        // Calcular distancia para cada bus
        const distanceA =
          busA.location !== null
            ? getDistanceBetweenLocations(userLocation, busA.location)
            : Infinity;
        const distanceB =
          busB.location !== null
            ? getDistanceBetweenLocations(userLocation, busB.location)
            : Infinity;

        // Ordenar de menor a mayor distancia
        return distanceA - distanceB;
      });
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
          <BusCard
            key={bus.id}
            bus={bus}
            userLocation={userLocation}
            onClick={() => handleBusClick(bus)}
          />
        ))}
      </div>
    );
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--color-bg)' }}>
        {isNavigating && <GlobalLoader />}
        <R2MPageHeader title="Buses en tiempo real" />

        {/* Barra de búsqueda y filtros */}
        <div
          className="px-4 pt-4 pb-3"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          {/* Barra de búsqueda */}
          <div className="relative mb-3">
            <div
              className="relative flex items-center transition-all duration-300"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid rgba(var(--color-terciary-rgb), 0.3)',
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
                className="w-full h-12 pl-12 pr-4 bg-transparent focus:outline-none"
                style={{ color: 'var(--color-text)' }}
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

      {/* Modal de detalles del bus */}
      {showBusModal && selectedBus && (
        <BusDetailModal
          bus={selectedBus}
          userLocation={userLocation}
          onClose={() => {
            setShowBusModal(false);
            setSelectedBus(null);
          }}
          onViewOnMap={handleViewBusOnMap}
        />
      )}
    </IonPage>
  );
}

interface BusCardProps {
  readonly bus: Bus;
  readonly userLocation: { latitude: number; longitude: number } | null;
  readonly onClick: () => void;
}

function BusCard({ bus, userLocation, onClick }: BusCardProps) {
  const { theme } = useTheme();
  // Calcular distancia en tiempo real (solo si el bus tiene ubicación Y el usuario también)
  const canCalculateDistance = bus.location !== null && userLocation !== null;
  const distance = canCalculateDistance
    ? getDistanceBetweenLocations(userLocation!, bus.location!)
    : Infinity;
  const isNearby =
    bus.status !== 'offline' && canCalculateDistance && distance <= 1.5; // 1.5 km threshold

  // Determinar si el bus no tiene ubicación (solo cuando el usuario sí tiene ubicación)
  const hasNoLocation =
    userLocation !== null && bus.location === null && bus.status !== 'offline';

  // Determinar estado dinámico basado en la distancia
  const getDynamicStatus = (): Bus['status'] => {
    if (bus.status === 'offline') return 'offline';
    if (isNearby) return 'nearby';
    return 'active';
  };

  const dynamicStatus = getDynamicStatus();

  // Función helper para obtener el color de fondo con opacidad
  const getRouteColorWithOpacity = (
    routeNumber: string,
    opacity: number = 0.1,
  ) => {
    const color = generateRouteColor(routeNumber);
    if (color === 'var(--color-secondary)') {
      return `rgba(30, 86, 160, ${opacity})`;
    }
    // Convertir hex a rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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
      className="p-4 rounded-xl cursor-pointer hover:shadow-md transition-all"
      style={{
        backgroundColor: hasNoLocation
          ? 'rgba(var(--color-card-rgb), 0.6)'
          : 'var(--color-card)',
        border: hasNoLocation
          ? '2px dashed rgba(156, 163, 175, 0.5)'
          : theme === 'dark'
            ? '1px solid var(--color-border)'
            : '1px solid rgba(var(--color-terciary-rgb), 0.2)',
        opacity: hasNoLocation ? 0.75 : 1,
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Badge del bus */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold relative"
          style={{
            backgroundColor:
              theme === 'dark' ? 'var(--color-surface)' : '#FFFFFF',
            border: hasNoLocation
              ? '2.5px dashed rgba(156, 163, 175, 0.5)'
              : `2.5px solid ${getOccupancyColor(bus.occupancy)}`,
            color: hasNoLocation ? '#9CA3AF' : getOccupancyColor(bus.occupancy),
            opacity: hasNoLocation ? 0.6 : 1,
          }}
        >
          <RiBusLine size={24} />
          {hasNoLocation && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: '#EF4444',
                border: '2px solid var(--color-card)',
              }}
            >
              <RiErrorWarningLine size={10} style={{ color: '#FFFFFF' }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Título con número de ruta */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className="font-semibold text-sm leading-tight"
                  style={{
                    color: dynamicStatus === 'offline' ? '#9CA3AF' : 'inherit',
                  }}
                >
                  {bus.plate}
                </h3>
                {dynamicStatus !== 'offline' &&
                  userLocation &&
                  bus.location && (
                    <span className="text-xs text-gray-500">
                      {formatDistance(distance)}
                    </span>
                  )}
              </div>
              {bus.routeNumber && bus.routeNumber !== 'N/A' && (
                <span
                  className="inline-block text-xs font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: getRouteColorWithOpacity(
                      bus.routeNumber,
                      0.1,
                    ),
                    color: generateRouteColor(bus.routeNumber),
                  }}
                >
                  {bus.routeName}
                </span>
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
          {dynamicStatus === 'offline' && (
            <p className="text-xs text-gray-500 mb-0.5">Fuera de servicio</p>
          )}
          {dynamicStatus !== 'offline' && !userLocation && (
            <p className="text-xs text-gray-500 mb-0.5">
              Permite acceso a ubicación
            </p>
          )}
          {hasNoLocation && (
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <RiErrorWarningLine
                size={16}
                style={{ color: '#EF4444', flexShrink: 0 }}
              />
              <p className="text-xs font-medium" style={{ color: '#EF4444' }}>
                Sin ubicación disponible
              </p>
            </div>
          )}

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

interface BusDetailModalProps {
  readonly bus: Bus;
  readonly userLocation: { latitude: number; longitude: number } | null;
  readonly onClose: () => void;
  readonly onViewOnMap: () => void;
}

/**
 * Obtiene la tarifa según el tipo de vehículo
 */
function getFareByType(type: string): number | null {
  switch (type.toLowerCase()) {
    case 'bus':
      return 2650;
    case 'buseta':
      return 2900;
    case 'microbus':
      return 3000;
    default:
      return null;
  }
}

/**
 * Capitaliza el tipo de vehículo para mostrar
 */
function capitalizeType(type: string): string {
  switch (type.toLowerCase()) {
    case 'bus':
      return 'Bus';
    case 'buseta':
      return 'Buseta';
    case 'microbus':
      return 'Microbus';
    default:
      return type;
  }
}

function BusDetailModal({
  bus,
  userLocation,
  onClose,
  onViewOnMap,
}: BusDetailModalProps) {
  const canCalculateDistance = bus.location !== null && userLocation !== null;
  const distance = canCalculateDistance
    ? getDistanceBetweenLocations(userLocation!, bus.location!)
    : Infinity;

  const fare = getFareByType(bus.type);

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

  // Verificar si el bus puede ser visto en el mapa
  const canViewOnMap =
    bus.status === 'active' &&
    bus.activeRouteVariantId !== null &&
    bus.location !== null;

  return (
    <R2MModal
      isOpen={true}
      onClose={onClose}
      title={bus.plate}
      subtitle={`${bus.routeName} - Ruta ${bus.routeNumber}`}
      icon={<RiBusLine size={24} />}
      iconColor={getStatusColor(bus.status)}
      actions={
        <div className="space-y-3">
          <R2MButton
            onClick={onViewOnMap}
            variant="primary"
            size="large"
            fullWidth
            disabled={!canViewOnMap}
          >
            <div className="flex items-center justify-center gap-2">
              <RiMapPinLine size={20} />
              <span>
                {canViewOnMap ? 'Ver en el mapa' : 'No disponible en el mapa'}
              </span>
            </div>
          </R2MButton>

          <R2MButton onClick={onClose} variant="outline" size="large" fullWidth>
            Cerrar
          </R2MButton>
        </div>
      }
    >
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Estado</span>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${getStatusColor(bus.status)}20`,
            color: getStatusColor(bus.status),
          }}
        >
          {getStatusLabel(bus.status)}
        </span>
      </div>

      {/* Distance */}
      {canCalculateDistance && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Distancia</span>
          <span className="text-sm font-semibold">
            {distance < 1
              ? `${Math.round(distance * 1000)} m`
              : `${distance.toFixed(1)} km`}
          </span>
        </div>
      )}

      {/* Capacity */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Ocupación</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(bus.currentCapacity / bus.maxCapacity) * 100}%`,
                backgroundColor:
                  bus.occupancy === 'low'
                    ? '#10B981'
                    : bus.occupancy === 'medium'
                      ? '#F59E0B'
                      : '#EF4444',
              }}
            />
          </div>
          <span className="text-sm font-semibold">
            {Math.round((bus.currentCapacity / bus.maxCapacity) * 100)}%
          </span>
        </div>
      </div>

      {/* Tipo de vehículo */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Tipo de vehículo
        </span>
        <span className="text-sm font-semibold">
          {capitalizeType(bus.type)}
        </span>
      </div>

      {/* Accesibilidad */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Accesibilidad</span>
        <span className="text-sm font-semibold">
          {bus.hasRamp ? 'Con rampa' : 'Sin rampa'}
        </span>
      </div>

      {/* Tarifa */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Tarifa</span>
        <span className="text-sm font-semibold">
          {fare !== null
            ? `$${fare.toLocaleString('es-CO')} COP`
            : 'No disponible'}
        </span>
      </div>
    </R2MModal>
  );
}
