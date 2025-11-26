import { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import {
  RiBusLine,
  RiGridLine,
  RiGridFill,
  RiTimeLine,
  RiTimeFill,
  RiArrowRightSLine,
  RiQuestionLine,
  RiSearchLine,
  RiMapPinLine,
} from 'react-icons/ri';
import { IoSearch, IoSearchOutline } from 'react-icons/io5';
import {
  fetchAllRoutesData,
  getRecentRoutes,
  recentRoutesStorage,
  generateRouteColor,
  type Route,
} from '../services/routeService';
import { recentSearchesStorage } from '../services/recentSearchService';
import { fetchBuses, getBusesByRouteVariant } from '../services/busService';
import FilterSwitcher, {
  type FilterOption,
} from '../components/FilterSwitcher';
import GlobalLoader from '../../system/components/GlobalLoader';
import R2MButton from '../../../shared/components/R2MButton';
import R2MModal from '../../../shared/components/R2MModal';
import R2MPageHeader from '../../../shared/components/R2MPageHeader';

type FilterTab = 'all' | 'recent';

const FILTER_OPTIONS: readonly FilterOption<FilterTab>[] = [
  {
    id: 'all',
    label: 'Todas',
    iconOutline: RiGridLine,
    iconFilled: RiGridFill,
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
  const router = useIonRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Forzar actualización cuando se vuelve a la página para actualizar rutas recientes
  useIonViewDidEnter(() => {
    setRefreshKey((prev) => prev + 1);
  });

  // Cargar rutas al montar el componente
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar rutas y buses en paralelo
        const [fetchedRoutes, allBuses] = await Promise.all([
          fetchAllRoutesData(),
          fetchBuses(),
        ]);

        // Calcular buses activos para cada ruta
        const routesWithActiveBuses = fetchedRoutes.map((route) => {
          const activeBuses = getBusesByRouteVariant(allBuses, route.id);
          return {
            ...route,
            activeBuses: activeBuses.length,
          };
        });

        setRoutes(routesWithActiveBuses);
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
  }, [refreshKey]);

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

  const handleViewRoute = (route: Route) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const handleViewOnMap = () => {
    if (!selectedRoute) return;

    // Guardar la ruta como reciente
    recentRoutesStorage.saveRecentRoute(selectedRoute.id);
    recentSearchesStorage.saveRecentSearch({
      id: selectedRoute.id,
      type: 'route',
    });

    // Navegar a HomePage con la ruta seleccionada
    const routeData = {
      id: selectedRoute.id,
      code: selectedRoute.code,
      name: selectedRoute.name,
      path: selectedRoute.path || selectedRoute.variants?.[0]?.path,
      color: selectedRoute.color,
      stops: selectedRoute.stops,
    };

    // Guardar en el estado global para que HomePage pueda acceder
    (globalThis as { routeData?: typeof routeData }).routeData = routeData;

    setShowRouteModal(false);
    setSelectedRoute(null);
    router.push('/inicio', 'forward', 'push');
  };

  const getFilteredRoutes = (): Route[] => {
    // Las rutas ya son route variants con coordenadas
    let filteredRoutes = routes;

    // Aplicar filtro de categoría
    if (activeFilter === 'recent') {
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
      <IonContent style={{ '--background': 'var(--color-bg)' }}>
        <R2MPageHeader title="Rutas" />

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
                placeholder="Buscar ruta por número o destino..."
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

        {/* Vista agrupada (sin filtro) o vista filtrada */}
        {showGroupedView ? (
          <div className="px-4 py-2 space-y-4 animate-fade-in">
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
              onViewRoute={handleViewRoute}
              allRoutes={routes}
            />

            {/* Todas las Rutas */}
            <RouteSection
              title="Todas las Rutas"
              routes={getFilteredRoutes()
                .sort((a, b) => (b.activeBuses || 0) - (a.activeBuses || 0))
                .slice(0, PREVIEW_LIMIT)}
              onViewMore={() => handleViewMore('all')}
              showViewMore={getFilteredRoutes().length > PREVIEW_LIMIT}
              onViewRoute={handleViewRoute}
              allRoutes={routes}
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
                {(activeFilter === 'all'
                  ? [...filteredRoutes].sort(
                      (a, b) => (b.activeBuses || 0) - (a.activeBuses || 0),
                    )
                  : filteredRoutes
                ).map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onViewRoute={handleViewRoute}
                    allRoutes={routes}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <FareInfoCard />

        {/* Modal de información de ruta */}
        {showRouteModal && selectedRoute && (
          <RouteDetailModal
            route={selectedRoute}
            onClose={() => {
              setShowRouteModal(false);
              setSelectedRoute(null);
            }}
            onViewOnMap={handleViewOnMap}
          />
        )}
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
      style={{ backgroundColor: 'var(--color-card)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
          Tarifas de Transporte
        </h3>
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
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <p className="text-xl font-bold" style={{ color: 'white' }}>
                ${fare.price.toLocaleString('es-CO')}
              </p>
            </div>
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              {fare.type}
            </p>
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
  readonly onViewRoute: (route: Route) => void;
  readonly allRoutes?: Route[];
}

function RouteSection({
  title,
  routes,
  onViewMore,
  showViewMore,
  onViewRoute,
  allRoutes,
}: RouteSectionProps) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid rgba(var(--color-terciary-rgb), 0.1)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
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
          <RouteCard
            key={route.id}
            route={route}
            onViewRoute={onViewRoute}
            allRoutes={allRoutes}
          />
        ))}
      </div>
    </div>
  );
}

function RouteCard({
  route,
  onViewRoute,
  allRoutes,
}: {
  readonly route: Route;
  readonly onViewRoute: (route: Route) => void;
  readonly allRoutes?: Route[];
}) {
  // Obtener el color de la ruta
  const routeColor = route.color || generateRouteColor(route.code);

  // Agrupar variantes por código de ruta
  const variants = allRoutes
    ? allRoutes.filter((r) => r.code === route.code)
    : [route];

  const variantCount = variants.length;

  return (
    <div
      className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid rgba(var(--color-terciary-rgb), 0.2)',
      }}
      onClick={() => onViewRoute(route)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewRoute(route);
        }
      }}
      aria-label={`Ver información de la ruta ${route.name}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
            style={{
              backgroundColor:
                route.status === 'active' ? routeColor : '#9CA3AF',
            }}
          >
            {route.number}
          </div>
          {/* Círculos pequeños para variantes adicionales */}
          {variantCount > 1 && (
            <div className="absolute -bottom-1 -right-1 flex gap-0.5">
              {variants
                .slice(0, Math.min(variantCount - 1, 3))
                .map((variant, idx) => (
                  <div
                    key={variant.id}
                    className="w-3 h-3 rounded-full border-2 border-white"
                    style={{
                      backgroundColor:
                        variant.status === 'active' ? routeColor : '#9CA3AF',
                    }}
                    title={`Variante ${idx + 2}`}
                  />
                ))}
              {variantCount > 4 && (
                <div
                  className="w-3 h-3 rounded-full border-2 border-white flex items-center justify-center text-[6px] font-bold text-white"
                  style={{
                    backgroundColor: routeColor,
                  }}
                  title={`+${variantCount - 4} variantes más`}
                >
                  +
                </div>
              )}
            </div>
          )}
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
            {/* Icono de lupa sutil */}
            <div className="flex-shrink-0 opacity-60">
              <RiSearchLine
                size={16}
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
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

            <div className="flex items-center gap-2">
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
    </div>
  );
}

interface RouteDetailModalProps {
  readonly route: Route;
  readonly onClose: () => void;
  readonly onViewOnMap: () => void;
}

function RouteDetailModal({
  route,
  onClose,
  onViewOnMap,
}: RouteDetailModalProps) {
  // Obtener el color de la ruta
  const routeColor = route.color || generateRouteColor(route.code);

  return (
    <R2MModal
      isOpen={true}
      onClose={onClose}
      title={route.name}
      subtitle={`Ruta ${route.code}`}
      icon={route.number}
      iconColor={route.status === 'active' ? routeColor : '#9CA3AF'}
      actions={
        <div className="space-y-3">
          <R2MButton
            onClick={onViewOnMap}
            variant="primary"
            size="large"
            fullWidth
          >
            <div className="flex items-center justify-center gap-2">
              <RiMapPinLine size={20} />
              <span>Ver en el mapa</span>
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
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            route.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {route.status === 'active' ? 'Activa' : 'Fuera de servicio'}
        </span>
      </div>

      {/* Active Buses */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Buses activos</span>
        <div className="flex items-center gap-2">
          <RiBusLine
            size={16}
            style={{
              color:
                (route.activeBuses || 0) > 0
                  ? 'var(--color-secondary)'
                  : '#EF4444',
            }}
          />
          <span className="text-sm font-semibold">
            {route.activeBuses || 0}
          </span>
        </div>
      </div>

      {/* Next Bus */}
      {route.status === 'active' && route.nextBus !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Próximo bus</span>
          <span className="text-sm font-semibold text-green-600">
            {route.nextBus} min
          </span>
        </div>
      )}

      {/* Stops Count */}
      {route.stops && route.stops.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Paradas</span>
          <span className="text-sm font-semibold">
            {route.stops.length} paradas
          </span>
        </div>
      )}

      {/* Route Info */}
      {(route.via || route.duration || route.fare) && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Información
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            {route.via && (
              <p>
                <strong>Vía:</strong> {route.via}
              </p>
            )}
            {route.duration && (
              <p>
                <strong>Duración:</strong> {route.duration} min
              </p>
            )}
            {route.fare && (
              <p>
                <strong>Tarifa:</strong> ${route.fare.toLocaleString('es-CO')}
              </p>
            )}
          </div>
        </div>
      )}
    </R2MModal>
  );
}
