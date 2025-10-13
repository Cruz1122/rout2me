import { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { IoSearch, IoSearchOutline } from 'react-icons/io5';
import { RiBusLine } from 'react-icons/ri';
import { mockBuses, nearbyBuses, type Bus } from '../data/busesMock';
import FilterSwitcher, {
  type FilterOption,
} from '../components/FilterSwitcher';

type FilterTab = 'all' | 'active' | 'nearby';

const FILTER_OPTIONS: readonly FilterOption<FilterTab>[] = [
  {
    id: 'all',
    label: 'Todos',
    iconOutline: RiBusLine,
    iconFilled: RiBusLine,
  },
  {
    id: 'active',
    label: 'Activos',
    iconOutline: RiBusLine,
    iconFilled: RiBusLine,
  },
  {
    id: 'nearby',
    label: 'Cercanos',
    iconOutline: RiBusLine,
    iconFilled: RiBusLine,
  },
] as const;

export default function LivePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleFilterChange = (filter: FilterTab | null) => {
    setActiveFilter(filter);
  };

  const getFilteredBuses = (): Bus[] => {
    let buses = mockBuses;

    // Aplicar filtro de categoría (no excluyentes)
    if (activeFilter === 'active') {
      // Activos incluye tanto 'active' como 'nearby' (cercanos también están activos)
      buses = buses.filter(
        (bus) => bus.status === 'active' || bus.status === 'nearby',
      );
    } else if (activeFilter === 'nearby') {
      // Cercanos solo muestra los buses cercanos
      buses = nearbyBuses;
    }

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      buses = buses.filter(
        (bus) =>
          bus.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return buses;
  };

  const filteredBuses = getFilteredBuses();

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
        <div className="px-4 py-2">
          {filteredBuses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No se encontraron buses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBuses.map((bus) => (
                <BusCard key={bus.id} bus={bus} />
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

interface BusCardProps {
  readonly bus: Bus;
}

function BusCard({ bus }: BusCardProps) {
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

  const getOccupancyLabel = (occupancy: Bus['occupancy']) => {
    switch (occupancy) {
      case 'low':
        return 'Ocupación baja';
      case 'medium':
        return 'Ocupación media';
      case 'high':
        return 'Ocupación alta';
      default:
        return 'Sin datos';
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
            backgroundColor: getStatusColor(bus.status),
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
                  color: bus.status === 'offline' ? '#9CA3AF' : 'inherit',
                }}
              >
                Bus {bus.routeNumber} - {bus.routeName}
              </h3>
              {bus.licensePlate && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Placa: {bus.licensePlate}
                </p>
              )}
            </div>
            <span
              className="text-xs font-medium px-2 py-1 rounded flex-shrink-0"
              style={{
                backgroundColor: `${getStatusColor(bus.status)}20`,
                color: getStatusColor(bus.status),
              }}
            >
              {getStatusLabel(bus.status)}
            </span>
          </div>

          {/* Información adicional */}
          <p
            className="text-xs text-gray-500"
            style={{ marginBottom: bus.status === 'offline' ? 0 : '0.5rem' }}
          >
            {bus.distance}
          </p>

          {/* Ocupación */}
          {bus.status !== 'offline' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width:
                      bus.occupancy === 'low'
                        ? '33%'
                        : bus.occupancy === 'medium'
                          ? '66%'
                          : '100%',
                    backgroundColor: getOccupancyColor(bus.occupancy),
                  }}
                />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: getOccupancyColor(bus.occupancy) }}
              >
                {getOccupancyLabel(bus.occupancy)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
