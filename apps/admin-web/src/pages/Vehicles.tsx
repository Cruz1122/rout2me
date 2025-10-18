import { useState, useRef, useEffect } from 'react';
import { createVehicle as createVehicleApi } from '../api/vehicles_api';
import { Link } from 'react-router-dom';

export default function VehiclesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<
    'Active' | 'Inactive' | 'Maintenance' | 'Offline'
  >('Active');
  const [errors, setErrors] = useState<{
    company?: string;
    plate?: string;
    capacity?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);
  const toastEntryTimerRef = useRef<number | null>(null);

  function closeModal() {
    setIsAddOpen(false);
    setErrors({});
    setCompany('');
    setPlate('');
    setCapacity('');
    setStatus('Active');
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

  function createVehicle() {
    // validate
    const newErrors: { company?: string; plate?: string; capacity?: string } =
      {};
    const plateRegex = /^[A-Za-z]{3}\d{3}$/;
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
    createVehicleApi({ company, plate, capacity, status })
      .then((res) => {
        console.log('created', res);
        showToast('success', 'Vehículo creado correctamente.');
        closeModal();
      })
      .catch((err) => {
        console.error('create failed', err);
        showToast('error', 'Error al crear el vehículo.');
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
    const plateRegex = /^[A-Za-z]{3}\d{3}$/;
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
  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
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
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] px-10 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-[#111317]">
              <div className="size-4">
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h2 className="text-[#111317] text-lg font-bold leading-tight tracking-[-0.015em]">
                Route2Me Admin
              </h2>
            </div>
            <nav className="flex items-center gap-9">
              {[
                'Dashboard',
                'Live Fleet',
                'Vehicles',
                'Routes',
                'Incidents',
                'Availability',
              ].map((item) => {
                if (item === 'Dashboard') {
                  return (
                    <Link
                      key={item}
                      to="/"
                      className="text-[#111317] text-sm font-medium leading-normal"
                    >
                      {item}
                    </Link>
                  );
                }

                return (
                  <span
                    key={item}
                    className="text-[#111317] text-sm font-medium leading-normal"
                  >
                    {item}
                  </span>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <label className="flex flex-col min-w-40 !h-10 max-w-64">
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
                  placeholder="Search"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f4] focus:border-none h-full placeholder:text-[#646f87] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  defaultValue=""
                />
              </div>
            </label>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBp7dPtAb4z1NUY_zXf2l2Xx2EIGS2L-TzYlG35a6hEBJKIujDPmHc98zs9Pb3_czQn9BfQKVWSvDGo43EdoqEEVQRds0hFg4Swf6u9qC480vFATG9jyzIpL5NAu21Y0x_cNofzXrVsGPczwxQn8raT5CwD5hRrXu2Ni5tjtL7tHUwFVn4r3ce7IIaCS7D7p3vbBtJvmCu04kAjcqXqRaasN_2Mq7E1hT4Wxbwbv-pYWU0S3lnG5wMtbEIUa3FY_SMy9WV66zEFCAKB")',
              }}
            />
          </div>
        </header>

        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          {/* Left column: Vehicle details */}
          <div className="layout-content-container flex flex-col w-80">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#111317] tracking-light text-[32px] font-bold leading-tight min-w-72">
                Vehicle Details
              </p>
            </div>

            <div className="p-4 grid grid-cols-[20%_1fr] gap-x-6">
              {[
                ['Vehicle ID', '12345'],
                ['Code', 'V123'],
                ['Current Route ID', 'R6789'],
                ['Status', 'Active'],
                ['Occupancy %', '85%'],
                ['Speed (km/h)', '60'],
                ['Last Update', '2024-01-15 10:00 AM'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5"
                >
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    {label}
                  </p>
                  <p className="text-[#111317] text-sm font-normal leading-normal">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="text-[#111317] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Historical Data
            </h3>
            <div className="pb-3">
              <div className="flex border-b border-[#dcdfe5] px-4 gap-8">
                <a
                  className="flex flex-col items-center justify-center border-b-[3px] border-b-[#111317] text-[#111317] pb-[13px] pt-4"
                  href="#"
                >
                  <p className="text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
                    Past Routes
                  </p>
                </a>
                <a
                  className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#646f87] pb-[13px] pt-4"
                  href="#"
                >
                  <p className="text-[#646f87] text-sm font-bold leading-normal tracking-[0.015em]">
                    Incident History
                  </p>
                </a>
              </div>
            </div>

            {/* Past Routes table */}
            <div className="px-4 py-3 [container-type:inline-size]">
              <div className="flex overflow-hidden rounded-xl border border-[#dcdfe5] bg-white">
                <table className="flex-1">
                  <thead>
                    <tr className="bg-white">
                      <th className="table-past-120 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Route ID
                      </th>
                      <th className="table-past-240 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Start Time
                      </th>
                      <th className="table-past-360 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        End Time
                      </th>
                      <th className="table-past-480 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Distance (km)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        'R1234',
                        '2024-01-10 08:00 AM',
                        '2024-01-10 05:00 PM',
                        '250',
                      ],
                      [
                        'R5678',
                        '2024-01-11 09:00 AM',
                        '2024-01-11 06:00 PM',
                        '300',
                      ],
                      [
                        'R9101',
                        '2024-01-12 07:00 AM',
                        '2024-01-12 04:00 PM',
                        '200',
                      ],
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-t-[#dcdfe5]">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`h-[72px] px-4 py-2 w-[400px] text-sm font-normal leading-normal ${j === 0 ? 'text-[#111317]' : 'text-[#646f87]'} table-past-${(j + 1) * 120}`}
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
                @container(max-width:120px){.table-past-120{display:none}}
                @container(max-width:240px){.table-past-240{display:none}}
                @container(max-width:360px){.table-past-360{display:none}}
                @container(max-width:480px){.table-past-480{display:none}}
              `}</style>
            </div>

            <div className="flex px-4 py-3 justify-start">
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="truncate">Delete</span>
              </button>
            </div>
          </div>
          {/* Add Vehicle Modal */}
          {isAddOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
              <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
              <div
                className="relative z-50 w-[512px] max-w-[96%] rounded-xl bg-white p-6"
                style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
              >
                <h1 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left pb-3 pt-1">
                  Create Vehicle
                </h1>
                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                  <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                      Company
                    </p>
                    <select
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      onBlur={validateCompany}
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#dcdfe5] h-14 placeholder:text-[#646f87] p-[15px] text-base font-normal leading-normal"
                    >
                      <option value="">Select Company</option>
                      <option value="one">one</option>
                      <option value="two">two</option>
                      <option value="three">three</option>
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
                      Plate
                    </p>
                    <input
                      value={plate}
                      onChange={(e) =>
                        setPlate(
                          e.target.value
                            .replace(/[^A-Za-z0-9]/g, '')
                            .slice(0, 6)
                            .toUpperCase(),
                        )
                      }
                      onBlur={validatePlate}
                      maxLength={6}
                      placeholder="Enter Plate Number"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#dcdfe5] h-14 placeholder:text-[#646f87] p-[15px] text-base font-normal leading-normal"
                    />
                    {errors.plate && (
                      <p className="text-red-600 text-sm mt-2">
                        {errors.plate === 'Placa no válida'
                          ? 'Placa no válida. Debe tener 3 letras seguidas de 3 dígitos (ej: ABC123).'
                          : errors.plate}
                      </p>
                    )}
                  </label>
                </div>

                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                  <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-[#111317] text-base font-medium leading-normal pb-2">
                      Capacity
                    </p>
                    <input
                      value={capacity}
                      onChange={(e) =>
                        setCapacity(e.target.value.replace(/[^0-9]/g, ''))
                      }
                      onBlur={validateCapacity}
                      placeholder="Enter Capacity"
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
                      ['Active', 'Inactive', 'Maintenance', 'Offline'] as const
                    ).map((s) => (
                      <label
                        key={s}
                        className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-xl px-2 text-sm font-medium leading-normal ${status === s ? 'bg-white shadow-[0_0_4px_rgba(0,0,0,0.1)] text-[#111317]' : 'text-[#646f87]'}`}
                      >
                        <span className="truncate">{s}</span>
                        <input
                          type="radio"
                          name="vehicle-status"
                          className="invisible w-0"
                          value={s}
                          checked={status === s}
                          onChange={() => setStatus(s)}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-stretch">
                  <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-end">
                    <button
                      onClick={closeModal}
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]"
                    >
                      <span className="truncate">Cancel</span>
                    </button>
                    <button
                      onClick={createVehicle}
                      disabled={
                        !(
                          company.trim() &&
                          /^[A-Za-z]{3}\d{3}$/.test(plate) &&
                          /^\d+$/.test(capacity)
                        )
                      }
                      className={`flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${company.trim() && /^[A-Za-z]{3}\d{3}$/.test(plate) && /^\d+$/.test(capacity) ? 'bg-[#1d56c9] text-white cursor-pointer' : 'bg-[#cbd5e1] text-white/70 cursor-not-allowed'}`}
                    >
                      <span className="truncate">Create Vehicle</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right column: Vehicles list */}
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#111317] tracking-light text-[32px] font-bold leading-tight min-w-72">
                Vehicles
              </p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-medium leading-normal"
              >
                {loading ? (
                  <span className="animate-spin border-2 border-black/20 border-t-black w-3 h-3 rounded-full mr-2" />
                ) : null}
                <span className="truncate">Add Vehicle</span>
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
                    placeholder="Search vehicles"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111317] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f4] focus:border-none h-full placeholder:text-[#646f87] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    defaultValue=""
                  />
                </div>
              </label>
            </div>

            <div className="flex gap-3 p-3 flex-wrap pr-4">
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#f0f2f4] pl-4 pr-4">
                <p className="text-[#111317] text-sm font-medium leading-normal">
                  Status
                </p>
              </div>
            </div>

            {/* Vehicles table */}
            <div className="px-4 py-3 [container-type:inline-size]">
              <div className="flex overflow-hidden rounded-xl border border-[#dcdfe5] bg-white">
                <table className="flex-1">
                  <thead>
                    <tr className="bg-white">
                      <th className="table-veh-120 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        ID
                      </th>
                      <th className="table-veh-240 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Code
                      </th>
                      <th className="table-veh-360 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Current Route ID
                      </th>
                      <th className="table-veh-480 px-4 py-3 text-left text-[#111317] w-60 text-sm font-medium leading-normal">
                        Status
                      </th>
                      <th className="table-veh-600 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Occupancy %
                      </th>
                      <th className="table-veh-720 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Speed (km/h)
                      </th>
                      <th className="table-veh-840 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Last Update
                      </th>
                      <th className="table-veh-960 px-4 py-3 text-left text-[#111317] w-60 text-[#646f87] text-sm font-medium leading-normal"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        '12345',
                        'V123',
                        'R6789',
                        'Active',
                        '85%',
                        '60',
                        '2024-01-15 10:00 AM',
                        'Delete',
                      ],
                      [
                        '67890',
                        'V456',
                        'R1011',
                        'Inactive',
                        '0%',
                        '0',
                        '2024-01-14 08:00 PM',
                        'Delete',
                      ],
                      [
                        '11213',
                        'V789',
                        'R1213',
                        'Active',
                        '50%',
                        '45',
                        '2024-01-15 11:00 AM',
                        'Delete',
                      ],
                      [
                        '14151',
                        'V101',
                        'R1415',
                        'Maintenance',
                        '0%',
                        '0',
                        '2024-01-14 06:00 PM',
                        'Delete',
                      ],
                      [
                        '16171',
                        'V121',
                        'R1617',
                        'Active',
                        '90%',
                        '70',
                        '2024-01-15 09:30 AM',
                        'Delete',
                      ],
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-t-[#dcdfe5]">
                        {/* ID */}
                        <td className="table-veh-120 h-[72px] px-4 py-2 w-[400px] text-[#111317] text-sm font-normal leading-normal">
                          {row[0]}
                        </td>
                        {/* Code */}
                        <td className="table-veh-240 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                          {row[1]}
                        </td>
                        {/* Current Route ID */}
                        <td className="table-veh-360 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                          {row[2]}
                        </td>
                        {/* Status button */}
                        <td className="table-veh-480 h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-medium leading-normal w-full">
                            <span className="truncate">{row[3]}</span>
                          </button>
                        </td>
                        {/* Occupancy */}
                        <td className="table-veh-600 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                          {row[4]}
                        </td>
                        {/* Speed */}
                        <td className="table-veh-720 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                          {row[5]}
                        </td>
                        {/* Last Update */}
                        <td className="table-veh-840 h-[72px] px-4 py-2 w-[400px] text-[#646f87] text-sm font-normal leading-normal">
                          {row[6]}
                        </td>
                        {/* Action */}
                        <td className="table-veh-960 h-[72px] px-4 py-2 w-60 text-[#646f87] text-sm font-bold leading-normal tracking-[0.015em]">
                          {row[7]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <style>{`
                @container(max-width:120px){.table-veh-120{display:none}}
                @container(max-width:240px){.table-veh-240{display:none}}
                @container(max-width:360px){.table-veh-360{display:none}}
                @container(max-width:480px){.table-veh-480{display:none}}
                @container(max-width:600px){.table-veh-600{display:none}}
                @container(max-width:720px){.table-veh-720{display:none}}
                @container(max-width:840px){.table-veh-840{display:none}}
                @container(max-width:960px){.table-veh-960{display:none}}
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
