import { useState, useRef, useEffect } from 'react';
import {
  createRoute as createRouteApi,
  getRoutes,
  deleteRoute as deleteRouteApi,
  updateRoute as updateRouteApi,
} from '../api/routes_api';
import type { Route } from '../api/routes_api';
import {
  getRouteVariants,
  createRouteVariant as createRouteVariantApi,
  updateRouteVariant as updateRouteVariantApi,
  deleteRouteVariant as deleteRouteVariantApi,
} from '../api/route_variants_api';
import type { RouteVariant } from '../api/route_variants_api';
import { colorClasses } from '../styles/colors';
import RouteMapEditor from '../components/RouteMapEditor';
import type { Coordinate } from '../api/route_variants_api';

export default function RoutesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVariantAddOpen, setIsVariantAddOpen] = useState(false);
  const [isVariantEditOpen, setIsVariantEditOpen] = useState(false);
  const [isVariantDeleteOpen, setIsVariantDeleteOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [mapPath, setMapPath] = useState<Coordinate[]>([]);
  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    pathJson?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [variants, setVariants] = useState<RouteVariant[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<RouteVariant | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);
  const toastEntryTimerRef = useRef<number | null>(null);

  // Cargar rutas al montar el componente
  useEffect(() => {
    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRoutes() {
    try {
      setLoadingRoutes(true);
      const data = await getRoutes();
      setRoutes(data);
      // Seleccionar la primera ruta por defecto
      if (data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0]);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      showToast('error', 'Error al cargar las rutas');
    } finally {
      setLoadingRoutes(false);
    }
  }

  // Cargar variantes cuando cambia la ruta seleccionada
  useEffect(() => {
    if (selectedRoute) {
      loadVariants(selectedRoute.id);
    } else {
      setVariants([]);
      setSelectedVariant(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute]);

  async function loadVariants(routeId: string) {
    try {
      setLoadingVariants(true);
      const data = await getRouteVariants(routeId);
      setVariants(data);
      // Seleccionar la primera variante por defecto
      if (data.length > 0) {
        setSelectedVariant(data[0]);
      } else {
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error('Error loading route variants:', error);
      showToast('error', 'Error al cargar las variantes');
    } finally {
      setLoadingVariants(false);
    }
  }

  function closeModal() {
    setIsAddOpen(false);
    setErrors({});
    setCode('');
    setName('');
    setActive(true);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    };
  }, []);

  function showToast(type: 'success' | 'error', message: string) {
    // clear any existing timers
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (toastHideTimerRef.current) {
      clearTimeout(toastHideTimerRef.current);
      toastHideTimerRef.current = null;
    }
    if (toastEntryTimerRef.current) {
      clearTimeout(toastEntryTimerRef.current);
      toastEntryTimerRef.current = null;
    }

    // Mount toast initially hidden so we can animate its entrance
    setToast({ type, message, visible: false });
    // small delay to allow mounting, then set visible to true to trigger enter animation
    toastEntryTimerRef.current = window.setTimeout(() => {
      setToast((t) => (t ? { ...t, visible: true } : t));
      // hide after 4s (start hide animation slightly before remove)
      toastTimerRef.current = window.setTimeout(() => {
        setToast((t) => (t ? { ...t, visible: false } : t));
        // remove from DOM after animation completes
        toastHideTimerRef.current = window.setTimeout(() => {
          setToast(null);
        }, 300);
      }, 4000);
    }, 20);
  }

  function createRoute() {
    // validate
    const newErrors: {
      code?: string;
      name?: string;
    } = {};

    if (!code.trim()) newErrors.code = 'El código es obligatorio';
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // call API
    setLoading(true);
    createRouteApi({
      code,
      name,
      active,
    })
      .then((res) => {
        console.log('created', res);
        showToast('success', 'Ruta creada correctamente.');
        // Recargar la lista de rutas
        loadRoutes();
        closeModal();
      })
      .catch((err) => {
        console.error('create failed', err);
        showToast('error', 'Error al crear la ruta.');
      })
      .finally(() => setLoading(false));
  }

  // Validation on blur handlers
  function validateCode() {
    if (!code.trim())
      setErrors((e) => ({ ...e, code: 'El código es obligatorio' }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.code;
        return copy;
      });
  }

  function validateName() {
    if (!name.trim())
      setErrors((e) => ({ ...e, name: 'El nombre es obligatorio' }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.name;
        return copy;
      });
  }

  function openEditModal() {
    if (!selectedRoute) return;
    // Cargar los datos de la ruta seleccionada
    setCode(selectedRoute.code);
    setName(selectedRoute.name);
    setActive(selectedRoute.active);
    setErrors({});
    setIsEditOpen(true);
  }

  function closeEditModal() {
    setIsEditOpen(false);
    setCode('');
    setName('');
    setActive(true);
    setErrors({});
  }

  function updateRoute() {
    if (!selectedRoute) return;

    // validate
    const newErrors: {
      code?: string;
      name?: string;
    } = {};

    if (!code.trim()) newErrors.code = 'El código es obligatorio';
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    updateRouteApi(selectedRoute.id, {
      code,
      name,
      active,
    })
      .then(() => {
        showToast('success', 'Ruta actualizada correctamente');
        loadRoutes();
        closeEditModal();
      })
      .catch((err: unknown) => {
        console.error('update failed', err);
        showToast('error', 'Error al actualizar la ruta');
      })
      .finally(() => setLoading(false));
  }

  function confirmDelete() {
    if (!selectedRoute) return;

    setLoading(true);
    deleteRouteApi(selectedRoute.id)
      .then(() => {
        showToast('success', 'Ruta eliminada correctamente');
        setSelectedRoute(null);
        setIsDeleteOpen(false);
        loadRoutes();
      })
      .catch((err: unknown) => {
        console.error('delete failed', err);
        showToast('error', 'Error al eliminar la ruta');
      })
      .finally(() => setLoading(false));
  }

  // ========== FUNCIONES PARA VARIANTES ==========

  function openVariantAddModal() {
    setMapPath([]);
    setErrors({});
    setIsVariantAddOpen(true);
  }

  function closeVariantAddModal() {
    setIsVariantAddOpen(false);
    setMapPath([]);
    setErrors({});
  }

  function openVariantEditModal() {
    if (!selectedVariant) return;
    setMapPath(selectedVariant.path);
    setErrors({});
    setIsVariantEditOpen(true);
  }

  function closeVariantEditModal() {
    setIsVariantEditOpen(false);
    setMapPath([]);
    setErrors({});
  }

  function createVariant() {
    if (!selectedRoute) return;

    // Validar que haya al menos 2 puntos en el mapa
    if (mapPath.length < 2) {
      showToast('error', 'Debes marcar al menos 2 puntos en el mapa');
      return;
    }

    setLoading(true);

    createRouteVariantApi({
      route_id: selectedRoute.id,
      path: mapPath,
    })
      .then(() => {
        showToast('success', 'Variante creada correctamente');
        loadVariants(selectedRoute.id);
        closeVariantAddModal();
      })
      .catch((err: unknown) => {
        console.error('create variant failed', err);
        showToast('error', 'Error al crear la variante');
      })
      .finally(() => setLoading(false));
  }

  function updateVariant() {
    if (!selectedVariant || !selectedRoute) return;

    // Validar que haya al menos 2 puntos en el mapa
    if (mapPath.length < 2) {
      showToast('error', 'Debes marcar al menos 2 puntos en el mapa');
      return;
    }

    setLoading(true);

    updateRouteVariantApi(selectedVariant.id, {
      path: mapPath,
    })
      .then(() => {
        showToast('success', 'Variante actualizada correctamente');
        loadVariants(selectedRoute.id);
        closeVariantEditModal();
      })
      .catch((err: unknown) => {
        console.error('update variant failed', err);
        showToast('error', 'Error al actualizar la variante');
      })
      .finally(() => setLoading(false));
  }

  function confirmDeleteVariant() {
    if (!selectedVariant || !selectedRoute) return;

    setLoading(true);
    deleteRouteVariantApi(selectedVariant.id)
      .then(() => {
        showToast('success', 'Variante eliminada correctamente');
        setSelectedVariant(null);
        setIsVariantDeleteOpen(false);
        loadVariants(selectedRoute.id);
      })
      .catch((err: unknown) => {
        console.error('delete variant failed', err);
        showToast('error', 'Error al eliminar la variante');
      })
      .finally(() => setLoading(false));
  }

  // Filter routes based on search query
  const filteredRoutes = routes.filter((route) => {
    const query = searchQuery.toLowerCase();
    return (
      route.code.toLowerCase().includes(query) ||
      route.name.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-60 transform transition-all duration-300 ease-out ${
            toast.visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-3 scale-95'
          }`}
          style={{ willChange: 'opacity, transform' }}
        >
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border ${toast.type === 'success' ? 'bg-white text-gray-900 border-green-100' : 'bg-white text-gray-900 border-red-100'}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toast.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
            >
              {toast.type === 'success' ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate max-w-xs">
                {toast.message}
              </div>
            </div>
            <button
              className="ml-3 text-sm underline text-gray-500"
              onClick={() => setToast(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="gap-1 px-6 flex flex-1 justify-center py-5">
        {/* Left column: Route details */}
        <div className="layout-content-container flex flex-col w-80">
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-[#111317] tracking-light text-[32px] font-bold leading-tight min-w-72">
              Detalles de la Ruta
            </p>
          </div>

          <div className="p-4 grid grid-cols-[20%_1fr] gap-x-6">
            {selectedRoute ? (
              <>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    ID
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedRoute.id}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Código
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedRoute.code}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Nombre
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedRoute.name}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Estado
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedRoute.active ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Fecha de Creación
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedRoute.created_at
                      ? new Date(selectedRoute.created_at).toLocaleString(
                          'es-ES',
                          {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )
                      : 'N/A'}
                  </p>
                </div>
              </>
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-[#646f87] text-sm">
                  {loadingRoutes
                    ? 'Cargando...'
                    : 'Selecciona una ruta para ver sus detalles'}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {selectedRoute && (
            <div className="flex gap-3 px-4 pb-4">
              <button
                onClick={openEditModal}
                className={`flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 ${colorClasses.btnPrimary} text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity`}
              >
                Editar Ruta
              </button>
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors"
              >
                Eliminar Ruta
              </button>
            </div>
          )}

          {/* Variantes de la Ruta */}
          {selectedRoute && (
            <>
              <div className="flex flex-wrap justify-between gap-3 p-4 border-t border-[#dcdfe5] mt-4">
                <p className="text-[#111317] tracking-light text-xl font-bold leading-tight">
                  Variantes
                </p>
                <button
                  onClick={openVariantAddModal}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-3 bg-[#f0f2f4] text-[#111317] text-sm font-medium leading-normal hover:bg-[#e5e7eb]"
                >
                  + Nueva Variante
                </button>
              </div>

              <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                {loadingVariants ? (
                  <div className="text-center py-4">
                    <p className="text-[#646f87] text-sm">
                      Cargando variantes...
                    </p>
                  </div>
                ) : variants.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-[#646f87] text-sm">
                      No hay variantes para esta ruta
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVariant?.id === variant.id
                            ? 'bg-[#e8edf3] border-[#1980e6]'
                            : 'bg-white border-[#dcdfe5] hover:bg-[#f0f2f4]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[#111317] text-sm font-medium">
                            Variante #{variants.indexOf(variant) + 1}
                          </p>
                          <span className="text-xs text-[#646f87] bg-[#f0f2f4] px-2 py-1 rounded">
                            {variant.path.length} puntos
                          </span>
                        </div>
                        <p className="text-xs text-[#646f87]">
                          Distancia:{' '}
                          {variant.length_m_json
                            ? `${(variant.length_m_json / 1000).toFixed(2)} km`
                            : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones de acción para variante seleccionada */}
              {selectedVariant && (
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={openVariantEditModal}
                    className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-xl h-9 px-3 bg-[#1980e6] text-white text-sm font-medium leading-normal hover:bg-[#1567c2]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setIsVariantDeleteOpen(true)}
                    className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-xl h-9 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium leading-normal"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right column: Routes list */}
        <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-[#111317] tracking-light text-[32px] font-bold leading-tight min-w-72">
              Rutas
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-medium leading-normal"
            >
              {loading ? (
                <span className="animate-spin border-2 border-black/20 border-t-black w-3 h-3 rounded-full mr-2" />
              ) : (
                <span className="mr-2">+</span>
              )}
              <span className="truncate">Nueva Ruta</span>
            </button>
          </div>

          <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <div className="text-[#646f87] flex border-none bg-[#f0f2f4] items-center justify-center pl-4 rounded-l-xl border-r-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                  </svg>
                </div>
                <input
                  placeholder="Buscar rutas"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f4] focus:border-none h-full placeholder:text-[#646f87] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
              </div>
            </label>
          </div>

          {/* Routes table */}
          <div className="px-4 py-3 [container-type:inline-size]">
            <div className="flex overflow-hidden rounded-xl border border-[#dcdfe5] bg-white">
              <table className="flex-1">
                <thead>
                  <tr className="bg-white">
                    <th className="table-route-120 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Código
                    </th>
                    <th className="table-route-240 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Nombre
                    </th>
                    <th className="table-route-360 px-4 py-3 text-left text-[#111317] w-60 text-sm font-medium leading-normal">
                      Estado
                    </th>
                    <th className="table-route-480 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Fecha de Creación
                    </th>
                    <th className="table-route-600 px-4 py-3 text-left text-[#111317] w-60 text-[#646f87] text-sm font-medium leading-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRoutes ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-[72px] px-4 py-2 text-center text-[#646f87] text-sm"
                      >
                        Cargando rutas...
                      </td>
                    </tr>
                  ) : routes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-[72px] px-4 py-2 text-center text-[#646f87] text-sm"
                      >
                        No hay rutas disponibles
                      </td>
                    </tr>
                  ) : filteredRoutes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-[72px] px-4 py-2 text-center text-[#646f87] text-sm"
                      >
                        No se encontraron rutas
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes
                      .slice(
                        (currentPage - 1) * rowsPerPage,
                        currentPage * rowsPerPage,
                      )
                      .map((route) => {
                        return (
                          <tr
                            key={route.id}
                            className={`border-t border-t-[#dcdfe5] cursor-pointer hover:bg-[#f0f2f4] ${selectedRoute?.id === route.id ? 'bg-[#e8edf3]' : ''}`}
                            onClick={() => setSelectedRoute(route)}
                          >
                            {/* Código */}
                            <td className="table-route-120 h-[72px] px-4 py-2 w-[400px] text-[#111317] text-sm font-medium leading-normal">
                              {route.code}
                            </td>
                            {/* Nombre */}
                            <td className="table-route-240 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                              {route.name}
                            </td>
                            {/* Estado */}
                            <td className="table-route-360 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-medium leading-normal w-full">
                                <span className="truncate">
                                  {route.active ? 'Activa' : 'Inactiva'}
                                </span>
                              </button>
                            </td>
                            {/* Fecha de Creación */}
                            <td className="table-route-480 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                              {route.created_at
                                ? new Date(route.created_at).toLocaleDateString(
                                    'es-ES',
                                  )
                                : 'N/A'}
                            </td>
                            {/* Empty column for consistency */}
                            <td className="table-route-600 h-[72px] px-4 py-2 w-60"></td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#dcdfe5]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#646f87]">
                  Filas por página:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 rounded-lg border border-[#dcdfe5] bg-white text-sm text-[#111317] cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-[#646f87]">
                  {filteredRoutes.length === 0
                    ? '0 de 0'
                    : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, filteredRoutes.length)} de ${filteredRoutes.length}`}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f4] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        Math.ceil(filteredRoutes.length / rowsPerPage),
                        prev + 1,
                      ),
                    )
                  }
                  disabled={
                    currentPage >=
                    Math.ceil(filteredRoutes.length / rowsPerPage)
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f4] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Agregar Ruta */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => !loading && closeModal()}
          />
          <div className="relative z-50 bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-[#111317] text-xl font-bold mb-4">
              Crear Nueva Ruta
            </h2>

            <div className="flex flex-col gap-4">
              {/* Code */}
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                  Código *
                </p>
                <input
                  type="text"
                  placeholder="Ej: R001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={validateCode}
                  className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border h-14 placeholder:text-[#646f87] p-[15px] text-base font-normal leading-normal ${
                    errors.code
                      ? 'border-red-500 bg-red-50'
                      : 'border-[#dcdfe5] bg-white'
                  }`}
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </label>

              {/* Name */}
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                  Nombre *
                </p>
                <input
                  type="text"
                  placeholder="Ej: Ruta Norte"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={validateName}
                  className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border h-14 placeholder:text-[#646f87] p-[15px] text-base font-normal leading-normal ${
                    errors.name
                      ? 'border-red-500 bg-red-50'
                      : 'border-[#dcdfe5] bg-white'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </label>

              {/* Active */}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 rounded border-[#dcdfe5] text-[#1980e6] focus:ring-[#1980e6]"
                />
                <span className="text-[#111317] text-base font-medium">
                  Ruta activa
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => !loading && closeModal()}
                disabled={loading}
                className={`flex-1 h-10 px-4 rounded-xl border border-[#dcdfe5] bg-white text-[#111317] text-sm font-bold ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0f2f4]'}`}
              >
                Cancelar
              </button>
              <button
                onClick={createRoute}
                disabled={
                  loading ||
                  !code.trim() ||
                  !name.trim() ||
                  Object.keys(errors).length > 0
                }
                className={`flex-1 h-10 px-4 rounded-xl text-sm font-bold ${
                  code.trim() &&
                  name.trim() &&
                  Object.keys(errors).length === 0 &&
                  !loading
                    ? colorClasses.btnSecondary
                    : 'bg-[#cbd5e1] text-white/70 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creando...' : 'Crear Ruta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isEditOpen && selectedRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#111317] text-xl font-bold">Editar Ruta</h2>
              <button
                onClick={() => !loading && closeEditModal()}
                disabled={loading}
                className="text-[#646f87] hover:text-[#111317]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-[#111317] text-sm font-medium">
                  Código *
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={validateCode}
                  placeholder="Ej: R001"
                  className="h-12 px-4 rounded-xl border border-[#dcdfe5] focus:outline-none focus:border-[#1980e6] text-[#111317]"
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[#111317] text-sm font-medium">
                  Nombre *
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={validateName}
                  placeholder="Ej: Ruta Norte"
                  className="h-12 px-4 rounded-xl border border-[#dcdfe5] focus:outline-none focus:border-[#1980e6] text-[#111317]"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 rounded border-[#dcdfe5] text-[#1980e6] focus:ring-[#1980e6]"
                />
                <span className="text-[#111317] text-sm font-medium">
                  Ruta activa
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => !loading && closeEditModal()}
                disabled={loading}
                className={`flex-1 h-10 px-4 rounded-xl border border-[#dcdfe5] bg-white text-[#111317] text-sm font-bold ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0f2f4]'}`}
              >
                Cancelar
              </button>
              <button
                onClick={updateRoute}
                disabled={
                  loading ||
                  !code.trim() ||
                  !name.trim() ||
                  Object.keys(errors).length > 0
                }
                className={`flex-1 h-10 px-4 rounded-xl text-sm font-bold ${
                  code.trim() &&
                  name.trim() &&
                  Object.keys(errors).length === 0 &&
                  !loading
                    ? colorClasses.btnSecondary
                    : 'bg-[#cbd5e1] text-white/70 cursor-not-allowed'
                }`}
              >
                {loading ? 'Actualizando...' : 'Actualizar Ruta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteOpen && selectedRoute && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3
              className={`text-xl font-bold ${colorClasses.textPrimary} mb-4`}
            >
              Eliminar Ruta
            </h3>
            <p className={`${colorClasses.textTerciary} mb-6`}>
              ¿Estás seguro de que deseas eliminar la ruta{' '}
              <strong>{selectedRoute.name}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium ${colorClasses.btnSurface} rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Variante */}
      {isVariantAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => !loading && closeVariantAddModal()}
          />
          <div className="relative z-50 bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-[#111317] text-xl font-bold mb-4">
              Crear Nueva Variante
            </h2>

            <div className="mb-6">
              <RouteMapEditor initialPath={mapPath} onPathChange={setMapPath} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => !loading && closeVariantAddModal()}
                disabled={loading}
                className={`flex-1 h-10 px-4 rounded-xl border border-[#dcdfe5] bg-white text-[#111317] text-sm font-bold ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0f2f4]'}`}
              >
                Cancelar
              </button>
              <button
                onClick={createVariant}
                disabled={loading || mapPath.length < 2}
                className={`flex-1 h-10 px-4 rounded-xl text-sm font-bold ${
                  mapPath.length >= 2 && !loading
                    ? colorClasses.btnSecondary
                    : 'bg-[#cbd5e1] text-white/70 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creando...' : 'Crear Variante'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Variante */}
      {isVariantEditOpen && selectedVariant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#111317] text-xl font-bold">
                Editar Variante
              </h2>
              <button
                onClick={() => !loading && closeVariantEditModal()}
                disabled={loading}
                className="text-[#646f87] hover:text-[#111317]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <RouteMapEditor initialPath={mapPath} onPathChange={setMapPath} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => !loading && closeVariantEditModal()}
                disabled={loading}
                className={`flex-1 h-10 px-4 rounded-xl border border-[#dcdfe5] bg-white text-[#111317] text-sm font-bold ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0f2f4]'}`}
              >
                Cancelar
              </button>
              <button
                onClick={updateVariant}
                disabled={loading || mapPath.length < 2}
                className={`flex-1 h-10 px-4 rounded-xl text-sm font-bold ${
                  mapPath.length >= 2 && !loading
                    ? colorClasses.btnSecondary
                    : 'bg-[#cbd5e1] text-white/70 cursor-not-allowed'
                }`}
              >
                {loading ? 'Actualizando...' : 'Actualizar Variante'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar Variante */}
      {isVariantDeleteOpen && selectedVariant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3
              className={`text-xl font-bold ${colorClasses.textPrimary} mb-4`}
            >
              Eliminar Variante
            </h3>
            <p className={`${colorClasses.textTerciary} mb-6`}>
              ¿Estás seguro de que deseas eliminar esta variante? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsVariantDeleteOpen(false)}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium ${colorClasses.btnSurface} rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteVariant}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
