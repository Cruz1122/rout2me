import { useState, useRef, useEffect } from 'react';
import {
  createVehicle as createVehicleApi,
  getVehicles,
  getCompanies,
  deleteVehicle as deleteVehicleApi,
} from '../api/vehicles_api';
import type { Vehicle, VehicleStatus, Company } from '../api/vehicles_api';
import { colorClasses } from '../styles/colors';
import GlobalLoader from '../components/GlobalLoader';
import PageHeader from '../components/PageHeader';

export default function VehiclesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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

  // Cargar vehículos al montar el componente
  useEffect(() => {
    loadVehicles();
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
  }, [isAddOpen]);

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
            <button
              className="ml-3 text-sm underline text-gray-500"
              onClick={() => setToast(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <PageHeader
        title="Vehículos"
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-medium leading-normal"
          >
            {loading ? (
              <span className="animate-spin border-2 border-black/20 border-t-black w-3 h-3 rounded-full mr-2" />
            ) : null}
            <span className="truncate">Agregar Vehículo</span>
          </button>
        }
      />

      <div className="gap-1 px-6 flex flex-1 justify-center py-5">
        {/* Left column: Vehicle details */}
        <div className="layout-content-container flex flex-col w-80">
          <h2 className="text-[#111317] tracking-light text-[22px] font-bold leading-tight px-4 pb-3 pt-5">
            Detalles del Vehículo
          </h2>

          <div className="p-4 grid grid-cols-[20%_1fr] gap-x-6">
            {selectedVehicle ? (
              <>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    ID del Vehículo
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedVehicle.id}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Placa
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedVehicle.plate}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Compañía ID
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedVehicle.company_id}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Estado
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedVehicle.status === 'AVAILABLE'
                      ? 'Disponible'
                      : selectedVehicle.status === 'IN_SERVICE'
                        ? 'En Servicio'
                        : selectedVehicle.status === 'MAINTENANCE'
                          ? 'Mantenimiento'
                          : 'Fuera de Servicio'}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Capacidad
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedVehicle.capacity} pasajeros
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Pasajeros Actuales
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedVehicle.passenger_count}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Último Mantenimiento
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {selectedVehicle.last_maintenance
                      ? new Date(
                          selectedVehicle.last_maintenance,
                        ).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Sin mantenimiento registrado'}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5">
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    Fecha de Creación
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {new Date(selectedVehicle.created_at).toLocaleString(
                      'es-ES',
                      {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </p>
                </div>
              </>
            ) : loadingVehicles ? (
              <div className="col-span-2">
                <GlobalLoader />
              </div>
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-[#646f87] text-sm">
                  Selecciona un vehículo para ver sus detalles
                </p>
              </div>
            )}
          </div>

          <div className="flex px-4 py-3 justify-start">
            <button
              onClick={() =>
                selectedVehicle && openDeleteModal(selectedVehicle)
              }
              disabled={!selectedVehicle}
              className={`flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors ${!selectedVehicle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="truncate">Eliminar</span>
            </button>
          </div>
        </div>
        {/* Add Vehicle Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
            <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
            <div
              className="relative z-50 w-[512px] max-w-[96%] rounded-xl bg-white p-6"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <h1 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left pb-3 pt-1">
                Crear Vehículo
              </h1>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                    Compañía
                  </p>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    onBlur={validateCompany}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#dcdfe5] h-14 placeholder:text-[#646f87] p-[15px] text-base font-normal leading-normal"
                  >
                    <option value="" disabled>
                      {loadingCompanies
                        ? 'Cargando...'
                        : 'Seleccione una compañía'}
                    </option>
                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}{' '}
                        {comp.short_name ? `(${comp.short_name})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.company && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.company}
                    </p>
                  )}
                </label>
              </div>

              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                    Placa
                  </p>
                  <input
                    value={plate}
                    onChange={(e) => {
                      const formatted = formatPlate(e.target.value);
                      setPlate(formatted);
                    }}
                    onBlur={validatePlate}
                    maxLength={7}
                    placeholder="ABC-123"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#dcdfe5] h-14 placeholder:text-[#646f87] p-[15px] text-base font-normal leading-normal"
                  />
                  {errors.plate && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.plate === 'Placa no válida'
                        ? 'Placa no válida. Debe tener 3 letras, guion y 3 dígitos (ej: ABC-123).'
                        : errors.plate}
                    </p>
                  )}
                </label>
              </div>

              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                    Capacidad
                  </p>
                  <input
                    value={capacity}
                    onChange={(e) =>
                      setCapacity(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    onBlur={validateCapacity}
                    placeholder="Ingrese Capacidad"
                    inputMode="numeric"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#dcdfe5] h-14 placeholder:text-[#646f87] p-[15px] text-base font-normal leading-normal"
                  />
                  {errors.capacity && (
                    <p className="text-red-600 text-sm mt-2">
                      {errors.capacity === 'Capacity must be numeric'
                        ? 'La capacidad debe ser numérica.'
                        : errors.capacity}
                    </p>
                  )}
                </label>
              </div>

              <div className="flex px-4 py-3">
                <div className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[#f0f2f4] p-1">
                  {(
                    [
                      { label: 'Disponible', value: 'AVAILABLE' },
                      { label: 'En Servicio', value: 'IN_SERVICE' },
                      { label: 'Mantenimiento', value: 'MAINTENANCE' },
                      { label: 'Fuera de Servicio', value: 'OUT_OF_SERVICE' },
                    ] as const
                  ).map((s) => {
                    return (
                      <label
                        key={s.value}
                        className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-xl px-2 text-sm font-medium leading-normal ${status === s.value ? 'bg-white shadow-[0_0_4px_rgba(0,0,0,0.1)] text-[#111317]' : 'text-[#646f87]'}`}
                      >
                        <span className="truncate">{s.label}</span>
                        <input
                          type="radio"
                          name="vehicle-status"
                          className="invisible w-0"
                          value={s.value}
                          checked={status === s.value}
                          onChange={() => setStatus(s.value)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-stretch">
                <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-end">
                  <button
                    onClick={closeModal}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]"
                  >
                    <span className="truncate">Cancelar</span>
                  </button>
                  <button
                    onClick={createVehicle}
                    disabled={
                      !(
                        company.trim() &&
                        /^[A-Z]{3}-\d{3}$/.test(plate) &&
                        /^\d+$/.test(capacity)
                      )
                    }
                    className={`flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${company.trim() && /^[A-Z]{3}-\d{3}$/.test(plate) && /^\d+$/.test(capacity) ? colorClasses.btnSecondary : 'bg-[#cbd5e1] text-white/70 cursor-not-allowed'}`}
                  >
                    <span className="truncate">
                      {loading ? 'Creando...' : 'Crear Vehículo'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right column: Vehicles list */}
        <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
          <div className="px-4 py-3 pt-5">
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
                  placeholder="Buscar vehículos"
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

          {/* Vehicles table */}
          <div className="px-4 py-3 [container-type:inline-size]">
            <div className="flex overflow-hidden rounded-xl border border-[#dcdfe5] bg-white">
              <table className="flex-1">
                <thead>
                  <tr className="bg-white">
                    <th className="table-veh-120 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Placa
                    </th>
                    <th className="table-veh-240 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Capacidad
                    </th>
                    <th className="table-veh-360 px-4 py-3 text-left text-[#111317] w-60 text-sm font-medium leading-normal">
                      Estado
                    </th>
                    <th className="table-veh-480 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Pasajeros
                    </th>
                    <th className="table-veh-600 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Ocupación %
                    </th>
                    <th className="table-veh-720 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                      Último Mantenimiento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingVehicles ? (
                    <tr>
                      <td colSpan={6} className="h-[400px] p-0">
                        <GlobalLoader />
                      </td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-[72px] px-4 py-2 text-center text-[#646f87] text-sm"
                      >
                        No hay vehículos disponibles
                      </td>
                    </tr>
                  ) : filteredVehicles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-[72px] px-4 py-2 text-center text-[#646f87] text-sm"
                      >
                        No se encontraron vehículos
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles
                      .slice(
                        (currentPage - 1) * rowsPerPage,
                        currentPage * rowsPerPage,
                      )
                      .map((vehicle) => {
                        const occupancyPercentage =
                          vehicle.capacity > 0
                            ? Math.round(
                                (vehicle.passenger_count / vehicle.capacity) *
                                  100,
                              )
                            : 0;
                        const statusText =
                          vehicle.status === 'AVAILABLE'
                            ? 'Disponible'
                            : vehicle.status === 'IN_SERVICE'
                              ? 'En Servicio'
                              : vehicle.status === 'MAINTENANCE'
                                ? 'Mantenimiento'
                                : 'Fuera de Servicio';

                        return (
                          <tr
                            key={vehicle.id}
                            className={`border-t border-t-[#dcdfe5] cursor-pointer hover:bg-[#f0f2f4] ${selectedVehicle?.id === vehicle.id ? 'bg-[#e8edf3]' : ''}`}
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            {/* Placa */}
                            <td className="table-veh-120 h-[72px] px-4 py-2 w-[400px] text-[#111317] text-sm font-medium leading-normal">
                              {vehicle.plate}
                            </td>
                            {/* Capacidad */}
                            <td className="table-veh-240 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                              {vehicle.capacity}
                            </td>
                            {/* Estado */}
                            <td className="table-veh-360 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-medium leading-normal w-full">
                                <span className="truncate">{statusText}</span>
                              </button>
                            </td>
                            {/* Pasajeros */}
                            <td className="table-veh-480 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                              {vehicle.passenger_count}
                            </td>
                            {/* Ocupación % */}
                            <td className="table-veh-600 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                              {occupancyPercentage}%
                            </td>
                            {/* Último Mantenimiento */}
                            <td className="table-veh-720 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                              {vehicle.last_maintenance
                                ? new Date(
                                    vehicle.last_maintenance,
                                  ).toLocaleDateString('es-ES')
                                : 'N/A'}
                            </td>
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
                  {filteredVehicles.length === 0
                    ? '0 de 0'
                    : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, filteredVehicles.length)} de ${filteredVehicles.length}`}
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
                        Math.ceil(filteredVehicles.length / rowsPerPage),
                        prev + 1,
                      ),
                    )
                  }
                  disabled={
                    currentPage >=
                    Math.ceil(filteredVehicles.length / rowsPerPage)
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

            <style>{`
                @container(max-width:120px){.table-veh-120{display:none}}
                @container(max-width:240px){.table-veh-240{display:none}}
                @container(max-width:360px){.table-veh-360{display:none}}
                @container(max-width:480px){.table-veh-480{display:none}}
                @container(max-width:600px){.table-veh-600{display:none}}
                @container(max-width:720px){.table-veh-720{display:none}}
              `}</style>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => !loading && closeDeleteModal()}
          />
          <div
            className="relative z-50 bg-white rounded-lg p-6 max-w-md w-full mx-4"
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
              <button
                onClick={() => !loading && closeDeleteModal()}
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
    </>
  );
}
