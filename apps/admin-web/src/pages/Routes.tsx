import { useState, useRef, useEffect } from 'react';
import {
  createRoute as createRouteApi,
  getRoutes,
  deleteRoute as deleteRouteApi,
  updateRoute as updateRouteApi,
} from '../api/routes_api';
import type { Route } from '../api/routes_api';
import PageHeader from '../components/PageHeader';
import {
  getRouteVariants,
  createRouteVariant as createRouteVariantApi,
  updateRouteVariant as updateRouteVariantApi,
  deleteRouteVariant as deleteRouteVariantApi,
  type RouteVariant,
  type Coordinate,
} from '../api/route_variants_api';
import { colorClasses } from '../styles/colors';
import RouteMapEditor from '../components/RouteMapEditor';
import R2MButton from '../components/R2MButton';
import R2MModal from '../components/R2MModal';
import R2MTable, { type R2MTableColumn } from '../components/R2MTable';
import R2MActionIconButton from '../components/R2MActionIconButton';
import R2MInput from '../components/R2MInput';
import R2MDetailDisplay, {
  type DetailItem,
} from '../components/R2MDetailDisplay';
import R2MCheckbox from '../components/R2MCheckbox';
import R2MSearchInput from '../components/R2MSearchInput';

export default function RoutesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVariantAddOpen, setIsVariantAddOpen] = useState(false);
  const [isVariantEditOpen, setIsVariantEditOpen] = useState(false);
  const [isVariantDeleteOpen, setIsVariantDeleteOpen] = useState(false);
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);
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

  // Cargar variantes cuando se abre el modal de variantes
  useEffect(() => {
    if (isVariantsModalOpen && selectedRoute) {
      loadVariants(selectedRoute.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVariantsModalOpen, selectedRoute]);

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

  // Generar items de detalle para la ruta seleccionada
  function getRouteDetailItems(route: Route | null): DetailItem[] {
    if (!route) return [];

    return [
      {
        label: 'ID de la Ruta',
        value: route.id,
        type: 'id',
        maxLength: 20,
        copyable: true,
      },
      {
        label: 'Código',
        value: route.code,
        type: 'text',
      },
      {
        label: 'Nombre',
        value: route.name,
        type: 'text',
      },
      {
        label: 'Estado',
        value: route.active ? 'Activa' : 'Inactiva',
        type: 'status',
      },
      {
        label: 'Fecha de Creación',
        value: route.created_at
          ? new Date(route.created_at).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'N/A',
        type: 'time',
      },
    ];
  }

  // Definir columnas de la tabla
  const tableColumns: R2MTableColumn<Route>[] = [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      width: '120px',
      render: (route) => (
        <span className={`font-medium ${colorClasses.textPrimary}`}>
          {route.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      width: '280px',
      render: (route) => <span className="text-[#97A3B1]">{route.name}</span>,
    },
    {
      key: 'active',
      header: 'Estado',
      sortable: true,
      width: '120px',
      render: (route) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${colorClasses.bgSurface} ${colorClasses.textPrimary}`}
        >
          {route.active ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha de Creación',
      sortable: true,
      width: '180px',
      render: (route) => (
        <span className="text-[#97A3B1]">
          {route.created_at
            ? new Date(route.created_at).toLocaleDateString('es-ES')
            : 'N/A'}
        </span>
      ),
    },
  ];

  // Renderizar botones de acciones para cada ruta
  const renderActions = (route: Route) => (
    <>
      <R2MActionIconButton
        icon="ri-eye-line"
        label="Ver detalles"
        variant="info"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRoute(route);
          setIsDetailsOpen(true);
        }}
      />
      <R2MActionIconButton
        icon="ri-git-branch-line"
        label="Ver variantes"
        variant="success"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRoute(route);
          setIsVariantsModalOpen(true);
        }}
      />
      <R2MActionIconButton
        icon="ri-edit-line"
        label="Editar ruta"
        variant="warning"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRoute(route);
          openEditModal();
        }}
      />
      <R2MActionIconButton
        icon="ri-delete-bin-line"
        label="Eliminar ruta"
        variant="danger"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedRoute(route);
          setIsDeleteOpen(true);
        }}
      />
    </>
  );

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
            <R2MButton
              onClick={() => setToast(null)}
              variant="ghost"
              size="sm"
              className="!h-auto !px-0 !py-0 text-sm underline text-gray-500"
            >
              Cerrar
            </R2MButton>
          </div>
        </div>
      )}

      <PageHeader
        title="Rutas"
        action={
          <R2MButton
            onClick={() => setIsAddOpen(true)}
            variant="surface"
            size="sm"
            icon="ri-add-line"
            iconPosition="left"
          >
            Nueva Ruta
          </R2MButton>
        }
      />

      <div className="gap-1 px-6 flex flex-1 justify-center py-5">
        {/* Routes list - Full width */}
        <div className="layout-content-container flex flex-col max-w-7xl mx-auto w-full">
          {/* Barra de búsqueda */}
          <div className="px-4 py-3 pt-5">
            <R2MSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar rutas por código o nombre..."
            />
          </div>

          {/* Routes table */}
          <div className="px-4 py-3">
            <R2MTable
              data={filteredRoutes}
              columns={tableColumns}
              loading={loadingRoutes}
              emptyMessage={
                searchQuery
                  ? 'No se encontraron rutas con ese criterio'
                  : 'No hay rutas disponibles'
              }
              getRowKey={(route) => route.id}
              defaultRowsPerPage={5}
              rowsPerPageOptions={[5, 10, 15, 20]}
              actions={renderActions}
            />
          </div>
        </div>
      </div>

      {/* Modal: Agregar Ruta */}
      <R2MModal
        isOpen={isAddOpen}
        onClose={closeModal}
        title="Crear Nueva Ruta"
        maxWidth="md"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton onClick={closeModal} variant="ghost" size="md">
              Cancelar
            </R2MButton>
            <R2MButton
              onClick={createRoute}
              disabled={
                !(
                  code.trim() &&
                  name.trim() &&
                  Object.keys(errors).length === 0
                )
              }
              loading={loading}
              variant="secondary"
              size="md"
              icon="ri-add-circle-line"
              iconPosition="left"
            >
              Crear Ruta
            </R2MButton>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="flex flex-col">
              <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                Código *
              </p>
              <R2MInput
                type="text"
                value={code}
                onValueChange={setCode}
                placeholder="Ej: R001"
                icon="ri-hashtag"
                error={errors.code}
                onBlur={validateCode}
              />
            </label>
          </div>

          <div>
            <label className="flex flex-col">
              <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                Nombre *
              </p>
              <R2MInput
                type="text"
                value={name}
                onValueChange={setName}
                placeholder="Ej: Ruta Norte"
                icon="ri-route-line"
                error={errors.name}
                onBlur={validateName}
              />
            </label>
          </div>

          <div>
            <R2MCheckbox
              checked={active}
              onChange={setActive}
              label="Ruta activa"
              helperText="Las rutas activas están disponibles para asignar a vehículos"
            />
          </div>
        </div>
      </R2MModal>

      {/* Modal de Edición */}
      <R2MModal
        isOpen={isEditOpen}
        onClose={closeEditModal}
        title="Editar Ruta"
        maxWidth="md"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton onClick={closeEditModal} variant="ghost" size="md">
              Cancelar
            </R2MButton>
            <R2MButton
              onClick={updateRoute}
              disabled={
                !(
                  code.trim() &&
                  name.trim() &&
                  Object.keys(errors).length === 0
                )
              }
              loading={loading}
              variant="secondary"
              size="md"
              icon="ri-save-line"
              iconPosition="left"
            >
              Actualizar Ruta
            </R2MButton>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="flex flex-col">
              <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                Código *
              </p>
              <R2MInput
                type="text"
                value={code}
                onValueChange={setCode}
                placeholder="Ej: R001"
                icon="ri-hashtag"
                error={errors.code}
                onBlur={validateCode}
              />
            </label>
          </div>

          <div>
            <label className="flex flex-col">
              <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                Nombre *
              </p>
              <R2MInput
                type="text"
                value={name}
                onValueChange={setName}
                placeholder="Ej: Ruta Norte"
                icon="ri-route-line"
                error={errors.name}
                onBlur={validateName}
              />
            </label>
          </div>

          <div>
            <R2MCheckbox
              checked={active}
              onChange={setActive}
              label="Ruta activa"
              helperText="Las rutas activas están disponibles para asignar a vehículos"
            />
          </div>
        </div>
      </R2MModal>

      {/* Modal de Confirmación de Eliminación */}
      <R2MModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar Ruta"
        maxWidth="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton
              onClick={() => setIsDeleteOpen(false)}
              disabled={loading}
              variant="ghost"
              size="md"
            >
              Cancelar
            </R2MButton>
            <R2MButton
              onClick={confirmDelete}
              disabled={loading}
              loading={loading}
              variant="danger"
              size="md"
              icon="ri-delete-bin-line"
              iconPosition="left"
            >
              Eliminar
            </R2MButton>
          </div>
        }
      >
        <p className={`${colorClasses.textTerciary}`}>
          ¿Estás seguro de que deseas eliminar la ruta{' '}
          <strong>{selectedRoute?.name}</strong>? Esta acción no se puede
          deshacer.
        </p>
      </R2MModal>

      {/* Modal de Detalles de la Ruta */}
      <R2MModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Detalles de la Ruta"
        maxWidth="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton
              onClick={() => {
                setIsDetailsOpen(false);
                if (selectedRoute) {
                  openEditModal();
                }
              }}
              variant="primary"
              size="md"
              icon="ri-edit-line"
              iconPosition="left"
            >
              Editar
            </R2MButton>
            <R2MButton
              onClick={() => {
                setIsDetailsOpen(false);
                setIsDeleteOpen(true);
              }}
              variant="danger"
              size="md"
              icon="ri-delete-bin-line"
              iconPosition="left"
            >
              Eliminar
            </R2MButton>
          </div>
        }
      >
        <R2MDetailDisplay
          items={getRouteDetailItems(selectedRoute)}
          loading={false}
          emptyMessage="No hay detalles disponibles"
        />
      </R2MModal>

      {/* Modal de Variantes */}
      <R2MModal
        isOpen={isVariantsModalOpen}
        onClose={() => {
          setIsVariantsModalOpen(false);
          setSelectedVariant(null);
        }}
        title={`Variantes de ${selectedRoute?.code || 'la Ruta'}`}
        maxWidth="xl"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton
              onClick={() => {
                setIsVariantsModalOpen(false);
                setSelectedVariant(null);
              }}
              variant="ghost"
              size="md"
            >
              Cerrar
            </R2MButton>
            <R2MButton
              onClick={() => {
                openVariantAddModal();
              }}
              variant="secondary"
              size="md"
              icon="ri-add-line"
              iconPosition="left"
            >
              Nueva Variante
            </R2MButton>
          </div>
        }
      >
        <div className="space-y-4">
          {loadingVariants ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1980e6]"></div>
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-git-branch-line text-5xl text-[#97A3B1] mb-3 block"></i>
              <p className="text-[#646f87] text-base font-medium">
                No hay variantes para esta ruta
              </p>
              <p className="text-[#97A3B1] text-sm mt-2">
                Crea una nueva variante para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="p-4 rounded-lg border transition-all bg-white border-[#dcdfe5] hover:border-[#97A3B1] hover:shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-[#111317] text-base font-semibold">
                        Variante #{index + 1}
                      </h4>
                      <p className="text-xs text-[#646f87] mt-1">
                        ID: {variant.id.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <R2MActionIconButton
                        icon="ri-edit-line"
                        label="Editar variante"
                        variant="info"
                        onClick={() => {
                          setSelectedVariant(variant);
                          openVariantEditModal();
                        }}
                      />
                      <R2MActionIconButton
                        icon="ri-delete-bin-line"
                        label="Eliminar variante"
                        variant="danger"
                        onClick={() => {
                          setSelectedVariant(variant);
                          setIsVariantDeleteOpen(true);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#646f87] mb-1">Puntos</p>
                      <p className="text-sm font-medium text-[#111317]">
                        {variant.path.length} puntos
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#646f87] mb-1">Distancia</p>
                      <p className="text-sm font-medium text-[#111317]">
                        {variant.length_m_json
                          ? `${(variant.length_m_json / 1000).toFixed(2)} km`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </R2MModal>

      {/* Modal: Agregar Variante */}
      <R2MModal
        isOpen={isVariantAddOpen}
        onClose={closeVariantAddModal}
        title="Crear Nueva Variante"
        maxWidth="2xl"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton onClick={closeVariantAddModal} variant="ghost" size="md">
              Cancelar
            </R2MButton>
            <R2MButton
              onClick={createVariant}
              disabled={mapPath.length < 2}
              loading={loading}
              variant="secondary"
              size="md"
              icon="ri-add-circle-line"
              iconPosition="left"
            >
              Crear Variante
            </R2MButton>
          </div>
        }
      >
        <div className="mb-2">
          <p className="text-sm text-[#646f87] mb-4">
            Marca al menos 2 puntos en el mapa para crear la variante de la
            ruta.
          </p>
          <RouteMapEditor
            initialPath={mapPath}
            onPathChange={setMapPath}
            height={350}
          />
        </div>
      </R2MModal>

      {/* Modal: Editar Variante */}
      <R2MModal
        isOpen={isVariantEditOpen}
        onClose={closeVariantEditModal}
        title="Editar Variante"
        maxWidth="2xl"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton
              onClick={closeVariantEditModal}
              variant="ghost"
              size="md"
            >
              Cancelar
            </R2MButton>
            <R2MButton
              onClick={updateVariant}
              disabled={mapPath.length < 2}
              loading={loading}
              variant="secondary"
              size="md"
              icon="ri-save-line"
              iconPosition="left"
            >
              Actualizar Variante
            </R2MButton>
          </div>
        }
      >
        <div className="mb-2">
          <RouteMapEditor
            initialPath={mapPath}
            onPathChange={setMapPath}
            height={350}
          />
        </div>
      </R2MModal>

      {/* Modal: Eliminar Variante */}
      <R2MModal
        isOpen={isVariantDeleteOpen}
        onClose={() => setIsVariantDeleteOpen(false)}
        title="Eliminar Variante"
        maxWidth="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton
              onClick={() => setIsVariantDeleteOpen(false)}
              disabled={loading}
              variant="ghost"
              size="md"
            >
              Cancelar
            </R2MButton>
            <R2MButton
              onClick={confirmDeleteVariant}
              disabled={loading}
              loading={loading}
              variant="danger"
              size="md"
              icon="ri-delete-bin-line"
              iconPosition="left"
            >
              Eliminar
            </R2MButton>
          </div>
        }
      >
        <p className={`${colorClasses.textTerciary}`}>
          ¿Estás seguro de que deseas eliminar esta variante? Esta acción no se
          puede deshacer.
        </p>
      </R2MModal>
    </>
  );
}
