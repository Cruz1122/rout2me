import { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  createVehicle as createVehicleApi,
  getVehicles,
  getCompanies,
  deleteVehicle as deleteVehicleApi,
  getRoutes,
  getRouteVariantsByRouteId,
  assignRouteToVehicle,
  removeRouteFromVehicle,
} from '../api/vehicles_api';
import type {
  Vehicle,
  VehicleStatus,
  Company,
  Route,
  RouteVariant,
} from '../api/vehicles_api';
import { processRouteWithCoordinates } from '../services/mapMatchingService';
import { colorClasses } from '../styles/colors';
import PageHeader from '../components/PageHeader';
import R2MDetailDisplay, {
  type DetailItem,
} from '../components/R2MDetailDisplay';
import R2MTable, { type R2MTableColumn } from '../components/R2MTable';
import R2MActionIconButton from '../components/R2MActionIconButton';
import R2MButton from '../components/R2MButton';
import R2MModal from '../components/R2MModal';
import R2MFilterSwitcher from '../components/R2MFilterSwitcher';
import R2MInput from '../components/R2MInput';
import R2MSelect from '../components/R2MSelect';
import R2MSearchInput from '../components/R2MSearchInput';

// Función para calcular tiempo relativo
function getTimeAgo(dateString: string | null): string {
  if (!dateString) return 'N/A';

  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `hace ${diffYears} año${diffYears > 1 ? 's' : ''}`;
  if (diffMonths > 0)
    return `hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
  if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffMinutes > 0) return `hace ${diffMinutes} min`;
  if (diffSeconds > 0) return `hace ${diffSeconds} seg`;
  return 'justo ahora';
}

export default function VehiclesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [company, setCompany] = useState('');
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');
  const [errors, setErrors] = useState<{
    company?: string;
    plate?: string;
    capacity?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);
  const toastEntryTimerRef = useRef<number | null>(null);

  // Estados para asignación de rutas
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeVariants, setRouteVariants] = useState<RouteVariant[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<RouteVariant | null>(
    null,
  );
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [assigningRoute, setAssigningRoute] = useState(false);

  // Cargar vehículos al montar el componente
  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVehicles() {
    try {
      setLoadingVehicles(true);
      const data = await getVehicles();
      setVehicles(data);
      // Seleccionar el primer vehículo por defecto
      if (data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(data[0]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      showToast('error', 'Error al cargar los vehículos');
    } finally {
      setLoadingVehicles(false);
    }
  }

  async function loadCompanies() {
    try {
      setLoadingCompanies(true);
      const data = await getCompanies();
      setCompanies(data);
      // Seleccionar la primera compañía por defecto si hay compañías
      if (data.length > 0 && !company) {
        setCompany(data[0].id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      showToast('error', 'Error al cargar las compañías');
    } finally {
      setLoadingCompanies(false);
    }
  }

  // Cargar compañías cuando se abre el modal
  useEffect(() => {
    if (isAddOpen) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddOpen]);

  // Cargar rutas cuando se abre el modal de rutas
  useEffect(() => {
    if (isRouteModalOpen) {
      loadRoutesForAssignment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouteModalOpen]);

  async function loadRoutesForAssignment() {
    try {
      setLoadingRoutes(true);
      const data = await getRoutes();
      const activeRoutes = data.filter((r) => r.active); // Solo rutas activas
      setRoutes(activeRoutes);

      // Si el vehículo tiene una ruta asignada, pre-cargarla
      if (selectedVehicle?.active_route_variant_id) {
        await preloadCurrentRoute(activeRoutes);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      showToast('error', 'Error al cargar las rutas');
    } finally {
      setLoadingRoutes(false);
    }
  }

  async function preloadCurrentRoute(activeRoutes: Route[]) {
    if (!selectedVehicle || !selectedVehicle.active_route_variant_id) return;

    try {
      setLoadingVariants(true);

      // Buscar en qué ruta está la variante activa
      for (const route of activeRoutes) {
        const variants = await getRouteVariantsByRouteId(route.id);
        const currentVariant = variants.find(
          (v) => v.variant_id === selectedVehicle.active_route_variant_id,
        );

        if (currentVariant) {
          // Encontramos la ruta y variante actual
          setSelectedRoute(route);
          setRouteVariants(variants);
          setSelectedVariant(currentVariant);
          break;
        }
      }
    } catch (error) {
      console.error('Error preloading current route:', error);
    } finally {
      setLoadingVariants(false);
    }
  }

  async function loadVariantsForRoute(routeId: string) {
    try {
      setLoadingVariants(true);
      const data = await getRouteVariantsByRouteId(routeId);
      setRouteVariants(data);
    } catch (error) {
      console.error('Error loading variants:', error);
      showToast('error', 'Error al cargar las variantes');
    } finally {
      setLoadingVariants(false);
    }
  }

  function openRouteModal() {
    setIsRouteModalOpen(true);
    // Resetear solo si NO hay ruta asignada
    if (!selectedVehicle?.active_route_variant_id) {
      setSelectedRoute(null);
      setSelectedVariant(null);
      setRouteVariants([]);
    }
  }

  function closeRouteModal() {
    setIsRouteModalOpen(false);
    setSelectedRoute(null);
    setSelectedVariant(null);
    setRouteVariants([]);
  }

  async function handleAssignRoute() {
    if (!selectedVehicle || !selectedVariant) return;

    try {
      setAssigningRoute(true);
      // Si el vehículo ya tiene active_trip_id, está en un trip activo
      const hasActiveTrip = Boolean(selectedVehicle.active_trip_id);
      await assignRouteToVehicle(
        selectedVehicle.id,
        selectedVariant.variant_id,
        hasActiveTrip,
      );
      showToast('success', 'Ruta asignada correctamente');
      closeRouteModal();

      // Recargar vehículos y actualizar el seleccionado
      const updatedVehicles = await getVehicles();
      setVehicles(updatedVehicles);
      const updatedVehicle = updatedVehicles.find(
        (v) => v.id === selectedVehicle.id,
      );
      if (updatedVehicle) {
        setSelectedVehicle(updatedVehicle);
      }
    } catch (error) {
      console.error('Error assigning route:', error);
      showToast('error', 'Error al asignar la ruta');
    } finally {
      setAssigningRoute(false);
    }
  }

  async function handleRemoveRoute() {
    if (!selectedVehicle) return;

    try {
      setAssigningRoute(true);
      await removeRouteFromVehicle(selectedVehicle.id);
      showToast('success', 'Ruta removida correctamente');

      // Recargar vehículos y actualizar el seleccionado
      const updatedVehicles = await getVehicles();
      setVehicles(updatedVehicles);
      const updatedVehicle = updatedVehicles.find(
        (v) => v.id === selectedVehicle.id,
      );
      if (updatedVehicle) {
        setSelectedVehicle(updatedVehicle);
      }
    } catch (error) {
      console.error('Error removing route:', error);
      showToast('error', 'Error al remover la ruta');
    } finally {
      setAssigningRoute(false);
    }
  }

  function closeModal() {
    setIsAddOpen(false);
    setErrors({});
    setCompany('');
    setPlate('');
    setCapacity('');
    setStatus('AVAILABLE');
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
        // remove after animation (300ms)
        toastHideTimerRef.current = window.setTimeout(
          () => setToast(null),
          400,
        );
      }, 4000);
    }, 20);
  }

  // Función para formatear la placa con guion automático (ABC-123)
  function formatPlate(value: string): string {
    // Remover todo excepto letras y números
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Si tiene más de 3 caracteres, insertar el guion
    if (cleaned.length > 3) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 6);
    }

    return cleaned;
  }

  function createVehicle() {
    // validate
    const newErrors: { company?: string; plate?: string; capacity?: string } =
      {};
    // Nueva regex para placa con guion: ABC-123
    const plateRegex = /^[A-Z]{3}-\d{3}$/;
    const capacityRegex = /^\d+$/;

    if (!company.trim()) newErrors.company = 'La compañía es obligatoria';
    if (!plate.trim()) newErrors.plate = 'La placa es obligatoria';
    else if (!plateRegex.test(plate)) newErrors.plate = 'Placa no válida';
    if (!capacity.trim()) newErrors.capacity = 'La capacidad es obligatoria';
    else if (!capacityRegex.test(capacity))
      newErrors.capacity = 'La capacidad debe ser numérica';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // call API
    setLoading(true);
    createVehicleApi({
      company_id: company,
      plate,
      capacity: parseInt(capacity),
      status,
    })
      .then((res) => {
        console.log('created', res);
        showToast('success', 'Vehículo creado correctamente.');
        // Recargar la lista de vehículos
        loadVehicles();
        closeModal();
      })
      .catch((err) => {
        console.error('create failed', err);
        // Mostrar el mensaje de error específico que viene del API
        const errorMessage =
          err instanceof Error ? err.message : 'Error al crear el vehículo.';
        showToast('error', errorMessage);
      })
      .finally(() => setLoading(false));
  }

  // Validation on blur handlers
  function validateCompany() {
    if (!company.trim())
      setErrors((e) => ({ ...e, company: 'La compañía es obligatoria' }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.company;
        return copy;
      });
  }

  function validatePlate() {
    // Nueva regex para placa con guion: ABC-123
    const plateRegex = /^[A-Z]{3}-\d{3}$/;
    if (!plate.trim())
      setErrors((e) => ({ ...e, plate: 'La placa es obligatoria' }));
    else if (!plateRegex.test(plate))
      setErrors((e) => ({ ...e, plate: 'Placa no válida' }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.plate;
        return copy;
      });
  }

  function validateCapacity() {
    const capacityRegex = /^\d+$/;
    if (!capacity.trim())
      setErrors((e) => ({ ...e, capacity: 'La capacidad es obligatoria' }));
    else if (!capacityRegex.test(capacity))
      setErrors((e) => ({ ...e, capacity: 'La capacidad debe ser numérica' }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.capacity;
        return copy;
      });
  }

  // Abrir modal de confirmación de eliminación
  function openDeleteModal(vehicle: Vehicle) {
    setVehicleToDelete(vehicle);
    setIsDeleteOpen(true);
  }

  // Cerrar modal de eliminación
  function closeDeleteModal() {
    setIsDeleteOpen(false);
    setVehicleToDelete(null);
  }

  // Confirmar eliminación
  function confirmDelete() {
    if (!vehicleToDelete) return;

    setLoading(true);
    deleteVehicleApi(vehicleToDelete.id)
      .then(() => {
        showToast('success', 'Vehículo eliminado correctamente.');
        // Si el vehículo eliminado estaba seleccionado, limpiar la selección
        if (selectedVehicle?.id === vehicleToDelete.id) {
          setSelectedVehicle(null);
        }
        closeDeleteModal();
        loadVehicles();
      })
      .catch((err) => {
        console.error('delete failed', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Error al eliminar el vehículo.';
        showToast('error', errorMessage);
      })
      .finally(() => setLoading(false));
  }

  // Filter vehicles based on search query (only by plate)
  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    return vehicle.plate.toLowerCase().includes(query);
  });

  // Definir columnas de la tabla
  const tableColumns: R2MTableColumn<Vehicle>[] = [
    {
      key: 'plate',
      header: 'Placa',
      sortable: true,
      width: '120px',
      render: (vehicle) => (
        <span className={`font-medium ${colorClasses.textPrimary}`}>
          {vehicle.plate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      width: '140px',
      render: (vehicle) => {
        const statusText =
          vehicle.status === 'AVAILABLE'
            ? 'Disponible'
            : vehicle.status === 'IN_SERVICE'
              ? 'En Servicio'
              : vehicle.status === 'MAINTENANCE'
                ? 'Mantenimiento'
                : 'Fuera de Servicio';
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${colorClasses.bgSurface} ${colorClasses.textPrimary}`}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      key: 'location',
      header: 'Ubicación',
      sortable: false,
      width: '180px',
      render: (vehicle) => {
        const locationText = vehicle.location_json
          ? `${vehicle.location_json.lat.toFixed(4)}, ${vehicle.location_json.lng.toFixed(4)}`
          : 'N/A';
        return <span className="text-[#97A3B1]">{locationText}</span>;
      },
    },
    {
      key: 'speed_kph',
      header: 'Velocidad',
      sortable: true,
      width: '100px',
      render: (vehicle) => {
        const speedText =
          vehicle.speed_kph !== null
            ? `${vehicle.speed_kph.toFixed(1)} km/h`
            : 'N/A';
        return <span className="text-[#97A3B1]">{speedText}</span>;
      },
    },
    {
      key: 'vp_at',
      header: 'Última Act. GPS',
      sortable: true,
      width: '140px',
      render: (vehicle) => (
        <span className="text-[#97A3B1]">{getTimeAgo(vehicle.vp_at)}</span>
      ),
    },
    {
      key: 'active_route_variant_id',
      header: 'Ruta Activa',
      sortable: true,
      width: '110px',
      render: (vehicle) => (
        <span className="text-[#97A3B1]">
          {vehicle.active_route_variant_id ? 'Sí' : 'No'}
        </span>
      ),
    },
  ];

  // Renderizar botones de acciones para cada vehículo
  const renderActions = (vehicle: Vehicle) => (
    <>
      <R2MActionIconButton
        icon="ri-eye-line"
        label="Ver detalles"
        variant="info"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedVehicle(vehicle);
          setIsDetailsOpen(true);
        }}
      />
      <R2MActionIconButton
        icon="ri-route-line"
        label={
          vehicle.active_route_variant_id ? 'Cambiar ruta' : 'Asignar ruta'
        }
        variant="success"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedVehicle(vehicle);
          openRouteModal();
        }}
      />
      <R2MActionIconButton
        icon="ri-delete-bin-line"
        label="Eliminar vehículo"
        variant="danger"
        onClick={(e) => {
          e.stopPropagation();
          openDeleteModal(vehicle);
        }}
      />
    </>
  );

  // Generar items de detalle para el vehículo seleccionado
  function getVehicleDetailItems(vehicle: Vehicle | null): DetailItem[] {
    if (!vehicle) return [];

    const statusText =
      vehicle.status === 'AVAILABLE'
        ? 'Disponible'
        : vehicle.status === 'IN_SERVICE'
          ? 'En Servicio'
          : vehicle.status === 'MAINTENANCE'
            ? 'Mantenimiento'
            : 'Fuera de Servicio';

    const locationText = vehicle.location_json
      ? `${vehicle.location_json.lat.toFixed(6)}, ${vehicle.location_json.lng.toFixed(6)}`
      : 'Sin ubicación';

    const speedText =
      vehicle.speed_kph !== null
        ? `${vehicle.speed_kph.toFixed(1)} km/h`
        : 'N/A';

    return [
      {
        label: 'ID del Vehículo',
        value: vehicle.id,
        type: 'id',
        maxLength: 20,
        copyable: true,
      },
      {
        label: 'Placa',
        value: vehicle.plate,
        type: 'text',
      },
      {
        label: 'Compañía ID',
        value: vehicle.company_id,
        type: 'id',
        maxLength: 20,
        copyable: true,
      },
      {
        label: 'Estado',
        value: statusText,
        type: 'status',
      },
      {
        label: 'Ubicación GPS',
        value: locationText,
        type: 'location',
      },
      {
        label: 'Velocidad',
        value: speedText,
        type: 'text',
      },
      {
        label: 'Última Act. GPS',
        value: getTimeAgo(vehicle.vp_at),
        type: 'time',
      },
      {
        label: 'Viaje Activo',
        value: vehicle.active_trip_id || 'Ninguno',
        type: 'id',
        maxLength: 20,
        copyable: vehicle.active_trip_id ? true : false,
      },
      {
        label: 'Ruta Activa',
        value: vehicle.active_route_variant_id || 'Ninguna',
        type: 'id',
        maxLength: 20,
        copyable: vehicle.active_route_variant_id ? true : false,
      },
    ];
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        // Modern styled toast with icon, shadow and smooth enter/exit animation
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
        title="Vehículos"
        action={
          <R2MButton
            onClick={() => setIsAddOpen(true)}
            variant="surface"
            size="sm"
            icon="ri-add-line"
            iconPosition="left"
          >
            Agregar Vehículo
          </R2MButton>
        }
      />

      <div className="gap-1 px-6 flex flex-1 justify-center py-5">
        {/* Add Vehicle Modal */}
        <R2MModal
          isOpen={isAddOpen}
          onClose={closeModal}
          title="Crear Vehículo"
          maxWidth="xl"
          footer={
            <div className="flex gap-3 justify-end">
              <R2MButton onClick={closeModal} variant="ghost" size="md">
                Cancelar
              </R2MButton>
              <R2MButton
                onClick={createVehicle}
                disabled={
                  !(
                    company.trim() &&
                    /^[A-Z]{3}-\d{3}$/.test(plate) &&
                    /^\d+$/.test(capacity)
                  )
                }
                loading={loading}
                variant="secondary"
                size="md"
                icon="ri-add-circle-line"
                iconPosition="left"
              >
                Crear Vehículo
              </R2MButton>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <label className="flex flex-col">
                <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                  Compañía
                </p>
                <R2MSelect
                  value={company}
                  onChange={setCompany}
                  options={companies.map((comp) => ({
                    value: comp.id,
                    label: `${comp.name}${comp.short_name ? ` (${comp.short_name})` : ''}`,
                  }))}
                  placeholder="Seleccione una compañía"
                  icon="ri-building-line"
                  loading={loadingCompanies}
                  error={errors.company}
                  onBlur={validateCompany}
                />
              </label>
            </div>

            <div>
              <label className="flex flex-col">
                <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                  Placa
                </p>
                <R2MInput
                  type="text"
                  value={plate}
                  onValueChange={(value) => {
                    const formatted = formatPlate(value);
                    setPlate(formatted);
                  }}
                  placeholder="ABC-123"
                  icon="ri-car-line"
                  maxLength={7}
                  error={
                    errors.plate === 'Placa no válida'
                      ? 'Placa no válida. Debe tener 3 letras, guion y 3 dígitos (ej: ABC-123).'
                      : errors.plate
                  }
                  onBlur={validatePlate}
                />
              </label>
            </div>

            <div>
              <label className="flex flex-col">
                <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                  Capacidad
                </p>
                <R2MInput
                  type="number"
                  value={capacity}
                  onValueChange={(value) =>
                    setCapacity(value.replace(/[^0-9]/g, ''))
                  }
                  placeholder="Ingrese la capacidad de pasajeros"
                  icon="ri-group-line"
                  error={
                    errors.capacity === 'Capacity must be numeric'
                      ? 'La capacidad debe ser numérica.'
                      : errors.capacity
                  }
                  onBlur={validateCapacity}
                />
              </label>
            </div>

            <div>
              <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                Estado
              </p>
              <R2MFilterSwitcher
                options={[
                  {
                    id: 'AVAILABLE',
                    label: 'Disponible',
                    icon: 'ri-checkbox-circle-line',
                  },
                  {
                    id: 'IN_SERVICE',
                    label: 'En Servicio',
                    icon: 'ri-steering-2-line',
                  },
                  {
                    id: 'MAINTENANCE',
                    label: 'Mantenimiento',
                    icon: 'ri-tools-line',
                  },
                  {
                    id: 'OUT_OF_SERVICE',
                    label: 'Fuera de Servicio',
                    icon: 'ri-close-circle-line',
                  },
                ]}
                activeFilter={status}
                onFilterChange={(filter) => setStatus(filter as VehicleStatus)}
                allowDeselect={false}
              />
            </div>
          </div>
        </R2MModal>

        {/* Vehicles list */}
        <div className="layout-content-container flex flex-col flex-1 max-w-7xl mx-auto w-full">
          {/* Barra de búsqueda */}
          <div className="px-4 py-3 pt-5">
            <R2MSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar vehículos por placa..."
            />
          </div>

          {/* Vehicles table */}
          <div className="px-4 py-3">
            <R2MTable
              data={filteredVehicles}
              columns={tableColumns}
              loading={loadingVehicles}
              emptyMessage={
                searchQuery
                  ? 'No se encontraron vehículos con ese criterio'
                  : 'No hay vehículos disponibles'
              }
              getRowKey={(vehicle) => vehicle.id}
              defaultRowsPerPage={5}
              rowsPerPageOptions={[5, 10, 15, 20]}
              actions={renderActions}
            />
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Vehículo */}
      {isDetailsOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsDetailsOpen(false)}
          />
          <div
            className="relative z-50 bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#111317]">
                Detalles del Vehículo
              </h2>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f4] text-[#646f87] transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <R2MDetailDisplay
              items={getVehicleDetailItems(selectedVehicle)}
              loading={false}
              emptyMessage="No hay detalles disponibles"
            />

            <div className="mt-6 pt-6 border-t border-[#dcdfe5]">
              <div className="flex gap-3 justify-end">
                {selectedVehicle?.active_route_variant_id ? (
                  <>
                    <R2MButton
                      variant="primary"
                      icon="ri-route-line"
                      onClick={() => {
                        setIsDetailsOpen(false);
                        openRouteModal();
                      }}
                    >
                      Cambiar Ruta
                    </R2MButton>
                    <R2MButton
                      variant="warning"
                      icon="ri-close-circle-line"
                      loading={assigningRoute}
                      onClick={async () => {
                        setIsDetailsOpen(false);
                        await handleRemoveRoute();
                      }}
                    >
                      Remover Ruta
                    </R2MButton>
                  </>
                ) : (
                  <R2MButton
                    variant="success"
                    icon="ri-add-circle-line"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      openRouteModal();
                    }}
                  >
                    Asignar Ruta
                  </R2MButton>
                )}
                <R2MButton
                  variant="danger"
                  icon="ri-delete-bin-line"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openDeleteModal(selectedVehicle);
                  }}
                >
                  Eliminar
                </R2MButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => !loading && closeDeleteModal()}
          />
          <div
            className="relative z-50 bg-white rounded-lg p-6 max-w-lg w-full mx-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <h2
              className={`text-xl font-bold ${colorClasses.textPrimary} mb-4`}
            >
              Eliminar Vehículo
            </h2>
            <p className={`${colorClasses.textTerciary} mb-6`}>
              ¿Estás seguro de que deseas eliminar el vehículo con placa{' '}
              <strong>{vehicleToDelete.plate}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <R2MButton
                onClick={() => !loading && closeDeleteModal()}
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
          </div>
        </div>
      )}

      {/* Modal de Asignación de Ruta */}
      {isRouteModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => !assigningRoute && closeRouteModal()}
          />
          <div
            className="relative z-50 bg-white rounded-lg p-6 max-w-5xl w-full mx-4 my-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#111317]">
                  {selectedVehicle.active_route_variant_id
                    ? 'Cambiar Ruta'
                    : 'Asignar Ruta'}
                </h2>
                <p className="text-[#97A3B1] text-sm mt-1">
                  Vehículo:{' '}
                  <span className="font-medium text-[#111317]">
                    {selectedVehicle.plate}
                  </span>
                </p>
              </div>
              <button
                onClick={() => !assigningRoute && closeRouteModal()}
                disabled={assigningRoute}
                className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f4] text-[#646f87] transition-colors ${assigningRoute ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Selector de Ruta */}
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                    Selecciona una Ruta
                  </p>
                  <R2MSelect
                    value={selectedRoute?.id || ''}
                    onChange={(value) => {
                      const route = routes.find((r) => r.id === value);
                      setSelectedRoute(route || null);
                      setSelectedVariant(null);
                      setRouteVariants([]);
                      if (route) {
                        loadVariantsForRoute(route.id);
                      }
                    }}
                    options={routes.map((route) => ({
                      value: route.id,
                      label: `${route.code} - ${route.name}`,
                    }))}
                    placeholder="Seleccione una ruta"
                    icon="ri-route-line"
                    loading={loadingRoutes}
                    disabled={loadingRoutes}
                  />
                </label>
              </div>

              {/* Selector de Variante */}
              <div>
                <label className="flex flex-col">
                  <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                    Selecciona una Variante
                  </p>
                  <R2MSelect
                    value={selectedVariant?.variant_id || ''}
                    onChange={(value) => {
                      const variant = routeVariants.find(
                        (v) => v.variant_id === value,
                      );
                      setSelectedVariant(variant || null);
                    }}
                    options={routeVariants.map((variant) => ({
                      value: variant.variant_id,
                      label: `Variante ${variant.variant_id.substring(0, 8)} (${variant.length_m_json ? `${(variant.length_m_json / 1000).toFixed(2)} km` : 'N/A'})`,
                    }))}
                    placeholder={
                      selectedRoute
                        ? 'Seleccione una variante'
                        : 'Primero seleccione una ruta'
                    }
                    icon="ri-git-branch-line"
                    loading={loadingVariants}
                    disabled={!selectedRoute || loadingVariants}
                  />
                </label>
              </div>
            </div>

            {/* Mapa de la Variante Seleccionada */}
            <div className="mb-6">
              <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                Vista Previa de la Ruta
              </p>
              {selectedVariant ? (
                <RouteMapPreview variant={selectedVariant} />
              ) : (
                <div className="h-[300px] rounded-xl border-2 border-dashed border-[#dcdfe5] bg-[#F6F6F6] flex items-center justify-center">
                  <div className="text-center">
                    <i className="ri-map-2-line text-5xl text-[#97A3B1] mb-3"></i>
                    <p className="text-[#97A3B1] text-base font-medium">
                      {!selectedRoute
                        ? 'Selecciona una ruta y variante para ver el mapa'
                        : !selectedVariant
                          ? 'Selecciona una variante para ver el mapa'
                          : 'No hay datos de mapa disponibles'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#dcdfe5]">
              <div className="flex gap-3 justify-end">
                <R2MButton
                  onClick={() => !assigningRoute && closeRouteModal()}
                  disabled={assigningRoute}
                  variant="ghost"
                  size="md"
                >
                  Cancelar
                </R2MButton>
                <R2MButton
                  onClick={handleAssignRoute}
                  disabled={!selectedVariant || assigningRoute}
                  loading={assigningRoute}
                  variant="primary"
                  size="md"
                  icon="ri-save-line"
                  iconPosition="left"
                >
                  {selectedVehicle.active_route_variant_id
                    ? 'Cambiar Ruta'
                    : 'Asignar Ruta'}
                </R2MButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente para mostrar vista previa del mapa
function RouteMapPreview({ variant }: { variant: RouteVariant }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [variant.path[0].lng, variant.path[0].lat],
      zoom: 13,
    });

    map.current.on('load', async () => {
      if (!map.current) return;

      // Obtener la API key desde las variables de entorno
      const apiKey = import.meta.env.VITE_STADIA_API_KEY;
      const shouldApplyMapMatching = Boolean(apiKey && apiKey.trim() !== '');

      // Preparar coordenadas originales
      const originalCoordinates: [number, number][] = variant.path.map((p) => [
        p.lng,
        p.lat,
      ]);

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

        // Agregar la ruta al mapa
        map.current!.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: processedRoute.matchedGeometry,
          },
        });

        map.current!.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#1E56A0',
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });

        // Ajustar vista para mostrar toda la ruta
        const bounds = new maplibregl.LngLatBounds();
        matchedCoordinates.forEach((coord) => bounds.extend(coord));
        map.current!.fitBounds(bounds, { padding: 40 });
      } catch (error) {
        console.error('Error processing route:', error);
        // Fallback: usar coordenadas originales
        map.current!.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: originalCoordinates,
            },
          },
        });

        map.current!.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#1E56A0',
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });

        // Ajustar vista para mostrar toda la ruta
        const bounds = new maplibregl.LngLatBounds();
        variant.path.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.current!.fitBounds(bounds, { padding: 40 });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [variant]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[300px] rounded-xl border border-[#dcdfe5] shadow-sm overflow-hidden"
    />
  );
}
