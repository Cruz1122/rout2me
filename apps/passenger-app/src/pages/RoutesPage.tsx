import { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  RiStarFill,
  RiStarLine,
  RiBusLine,
  RiGridLine,
  RiGridFill,
  RiTimeLine,
  RiTimeFill,
  RiArrowRightSLine,
  RiQuestionLine,
} from 'react-icons/ri';
import { IoSearch, IoSearchOutline } from 'react-icons/io5';
import {
  fetchRoutes,
  getFavoriteRoutes,
  getRecentRoutes,
  type Route,
} from '../services/routeService';
import FilterSwitcher, {
  type FilterOption,
} from '../components/FilterSwitcher';
import GlobalLoader from '../components/GlobalLoader';

type FilterTab = 'all' | 'favorites' | 'recent';

const FILTER_OPTIONS: readonly FilterOption<FilterTab>[] = [
  {
    id: 'all',
    label: 'Todas',
    iconOutline: RiGridLine,
    iconFilled: RiGridFill,
  },
  {
    id: 'favorites',
    label: 'Favoritas',
    iconOutline: RiStarLine,
    iconFilled: RiStarFill,
  },
  {
    id: 'recent',
    label: 'Recientes',
    iconOutline: RiTimeLine,
    iconFilled: RiTimeFill,
  },
] as const;

const PREVIEW_LIMIT = 5;

export default function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar rutas al montar el componente
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedRoutes = await fetchRoutes();
        setRoutes(fetchedRoutes);
      } catch (err) {
        console.error('Error loading routes:', err);
        setError(
          err instanceof Error ? err.message : 'Error al cargar las rutas',
        );
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, []);

  const handleViewMore = (filter: FilterTab) => {
    setActiveFilter(filter);
    // Scroll suave al inicio de la lista
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleFilterChange = (filter: FilterTab | null) => {
    setActiveFilter(filter);
  };

  const getFilteredRoutes = (): Route[] => {
    // Las rutas ya son route variants con coordenadas
    let filteredRoutes = routes;

    // Aplicar filtro de categoría
    if (activeFilter === 'favorites') {
      filteredRoutes = getFavoriteRoutes(routes);
    } else if (activeFilter === 'recent') {
      filteredRoutes = getRecentRoutes(routes);
    } else if (activeFilter === 'all') {
      filteredRoutes = routes;
    }

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      filteredRoutes = filteredRoutes.filter(
        (route) =>
          route.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.code.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filteredRoutes;
  };

  const filteredRoutes = getFilteredRoutes();
  // Mostrar vista agrupada solo cuando NO hay filtro activo Y NO hay búsqueda
  const showGroupedView = activeFilter === null && !searchQuery.trim();

  // Mostrar estado de carga
  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <GlobalLoader />
        </IonContent>
      </IonPage>
    );
  }

  // Mostrar estado de error
  if (error) {
    return (
      <IonPage>
        <IonContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => globalThis.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Reintentar
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
              Rutas
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
                placeholder="Buscar ruta por número o destino..."
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

        {/* Vista agrupada (sin filtro) o vista filtrada */}
        {showGroupedView ? (
          <div className="px-4 py-2 space-y-4 animate-fade-in">
            {/* Rutas Favoritas */}
            <RouteSection
              title="Rutas Favoritas"
              routes={getFavoriteRoutes(getFilteredRoutes()).slice(
                0,
                PREVIEW_LIMIT,
              )}
              onViewMore={() => handleViewMore('favorites')}
              showViewMore={
                getFavoriteRoutes(getFilteredRoutes()).length > PREVIEW_LIMIT
              }
            />

            {/* Rutas Recientes */}
            <RouteSection
              title="Rutas Recientes"
              routes={getRecentRoutes(getFilteredRoutes()).slice(
                0,
                PREVIEW_LIMIT,
              )}
              onViewMore={() => handleViewMore('recent')}
              showViewMore={
                getRecentRoutes(getFilteredRoutes()).length > PREVIEW_LIMIT
              }
            />

            {/* Todas las Rutas */}
            <RouteSection
              title="Todas las Rutas"
              routes={getFilteredRoutes().slice(0, PREVIEW_LIMIT)}
              onViewMore={() => handleViewMore('all')}
              showViewMore={getFilteredRoutes().length > PREVIEW_LIMIT}
            />
          </div>
        ) : (
          <div className="px-4 py-2 animate-fade-in">
            {filteredRoutes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No se encontraron rutas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoutes.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            )}
          </div>
        )}

        <FareInfoCard />
      </IonContent>
    </IonPage>
  );
}

function FareInfoCard() {
  const [showInfo, setShowInfo] = useState(false);

  const fares = [
    { type: 'Buses', price: 2650, color: 'var(--color-bg)' },
    { type: 'Busetas', price: 2900, color: 'var(--color-bg)' },
    { type: 'Microbuses', price: 3000, color: 'var(--color-bg)' },
  ];

  return (
    <div
      className="mx-4 my-4 p-4 rounded-xl"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Tarifas de Transporte</h3>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-6 h-6 !rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            backgroundColor: showInfo
              ? 'rgba(var(--color-primary-rgb), 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
            color: showInfo ? 'var(--color-primary)' : '#6B7280',
          }}
          aria-label="Información sobre tarifas"
        >
          <RiQuestionLine size={14} />
        </button>
      </div>

      {showInfo && (
        <div
          className="mb-4 p-3 rounded-lg text-xs animate-fade-in"
          style={{
            backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)',
            border: '1px solid rgba(var(--color-primary-rgb), 0.1)',
          }}
        >
          <p className="text-gray-700 leading-relaxed mb-2">
            Tarifas expedidas por el Ministerio de Transporte en los Decretos
            0042, 0043 y 0044 de Manizales.
          </p>
          <a
            href="https://centrodeinformacion.manizales.gov.co/nuevas-tarifas-del-servicio-de-transporte-publico-se-aplicaran-en-manizales"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium transition-colors duration-200"
            style={{ color: 'var(--color-primary)' }}
          >
            Más información
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M3.5 3C3.22386 3 3 3.22386 3 3.5C3 3.77614 3.22386 4 3.5 4V3ZM8.5 3.5H9C9 3.22386 8.77614 3 8.5 3V3.5ZM8 8.5C8 8.77614 8.22386 9 8.5 9C8.77614 9 9 8.77614 9 8.5H8ZM2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L2.64645 8.64645ZM3.5 4H8.5V3H3.5V4ZM8 3.5V8.5H9V3.5H8ZM8.14645 3.14645L2.64645 8.64645L3.35355 9.35355L8.85355 3.85355L8.14645 3.14645Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {fares.map((fare) => (
          <div key={fare.type} className="text-center">
            <div
              className="mb-2 p-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-secondary)' }}
            >
              <p className="text-xl font-bold" style={{ color: fare.color }}>
                ${fare.price.toLocaleString('es-CO')}
              </p>
            </div>
            <p className="text-xs text-gray-600 font-medium">{fare.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RouteSectionProps {
  readonly title: string;
  readonly routes: readonly Route[];
  readonly onViewMore: () => void;
  readonly showViewMore: boolean;
}

function RouteSection({
  title,
  routes,
  onViewMore,
  showViewMore,
}: RouteSectionProps) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
        {showViewMore && (
          <button
            onClick={onViewMore}
            className="flex items-center gap-1 text-sm font-medium transition-colors duration-200"
            style={{ color: 'var(--color-primary)' }}
          >
            Ver más
            <RiArrowRightSLine size={18} />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  );
}

function RouteCard({ route }: { readonly route: Route }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
          style={{
            backgroundColor:
              route.status === 'active' ? 'var(--color-secondary)' : '#9CA3AF',
          }}
        >
          {route.number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className="font-semibold text-sm leading-tight"
              style={{
                color: route.status === 'offline' ? '#9CA3AF' : 'inherit',
              }}
            >
              {route.name}
            </h3>
            <button className="flex-shrink-0">
              {route.isFavorite ? (
                <RiStarFill
                  size={20}
                  style={{ color: 'var(--color-primary)' }}
                />
              ) : (
                <RiStarLine size={20} className="text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <span
                className="flex items-center gap-1"
                style={{
                  color:
                    (route.activeBuses || 0) > 0
                      ? 'var(--color-secondary)'
                      : '#EF4444',
                }}
              >
                <RiBusLine size={14} />
                {route.activeBuses || 0} buses activos
              </span>
            </div>

            {route.status === 'active' && route.nextBus !== undefined && (
              <span
                className="text-xs font-medium px-2 py-1 rounded"
                style={{
                  backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
                  color: 'var(--color-secondary)',
                }}
              >
                Próximo: {route.nextBus} min
              </span>
            )}

            {route.status === 'offline' && (
              <span
                className="text-xs font-medium px-2 py-1 rounded"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                }}
              >
                Fuera de servicio
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
