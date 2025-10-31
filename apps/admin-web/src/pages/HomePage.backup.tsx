import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  const { clearAuth } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    clearAuth();
    setShowLogoutModal(false);
    navigate('/signin');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          {/* Sidebar */}
          <div className="layout-content-container flex flex-col w-80">
            <div className="flex h-full min-h-[700px] flex-col justify-between bg-white p-4">
              <div className="flex flex-col gap-4">
                <h1 className="text-[#111317] text-base font-medium leading-normal">
                  Route2Me Admin
                </h1>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#f0f2f4]">
                    <div
                      className="text-[#111317]"
                      data-icon="House"
                      data-size="24px"
                      data-weight="fill"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                      >
                        <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path>
                      </svg>
                    </div>
                    <p className="text-[#111317] text-sm font-medium leading-normal">
                      Dashboard
                    </p>
                  </div>

                  {[
                    {
                      label: 'Flota en Vivo',
                      path: 'M240,112H229.2L201.42,49.5A16,16,0,0,0,186.8,40H69.2a16,16,0,0,0-14.62,9.5L26.8,112H16a8,8,0,0,0,0,16h8v80a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V192h96v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V128h8a8,8,0,0,0,0-16ZM69.2,56H186.8l24.89,56H44.31ZM64,208H40V192H64Zm128,0V192h24v16Zm24-32H40V128H216ZM56,152a8,8,0,0,1,8-8H80a8,8,0,0,1,0,16H64A8,8,0,0,1,56,152Zm112,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H176A8,8,0,0,1,168,152Z',
                    },
                    {
                      label: 'Vehículos',
                      path: 'M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM24,72H168v64H24ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V152H168v12.31A32.11,32.11,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm48-24H215a32.06,32.06,0,0,0-31-24V128h48Z',
                    },
                    {
                      label: 'Rutas',
                      path: 'M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z',
                    },
                    {
                      label: 'Incidentes',
                      path: 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z',
                    },
                    {
                      label: 'Disponibilidad',
                      path: 'M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z',
                    },
                    {
                      label: 'Reportes',
                      path: 'M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176ZM104,120v24a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32-16v40a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v56a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z',
                    },
                    {
                      label: 'Usuarios y Roles',
                      path: 'M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,8,0,0,1,250.14,206.7Z',
                    },
                  ].map((item) => {
                    const content = (
                      <div className="flex items-center gap-3 px-3 py-2">
                        <div
                          className="text-[#111317]"
                          data-size="24px"
                          data-weight="regular"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24px"
                            height="24px"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d={item.path}></path>
                          </svg>
                        </div>
                        <p className="text-[#111317] text-sm font-medium leading-normal">
                          {item.label}
                        </p>
                      </div>
                    );

                    if (item.label === 'Vehículos') {
                      return (
                        <Link key={item.label} to="/vehicles" className="block">
                          {content}
                        </Link>
                      );
                    }

                    return <div key={item.label}>{content}</div>;
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div
                    className="text-[#111317]"
                    data-icon="Gear"
                    data-size="24px"
                    data-weight="regular"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"></path>
                    </svg>
                  </div>
                  <p className="text-[#111317] text-sm font-medium leading-normal">
                    Configuración
                  </p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f0f2f4] transition-colors cursor-pointer"
                >
                  <div className="text-[#111317]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z"></path>
                    </svg>
                  </div>
                  <p className="text-[#111317] text-sm font-medium leading-normal">
                    Cerrar Sesión
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Logout Confirmation Modal */}
          {showLogoutModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="fixed inset-0 bg-black/40"
                onClick={cancelLogout}
              />
              <div className="relative z-50 bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-[#111317] text-xl font-bold mb-4">
                  ¿Cerrar sesión?
                </h3>
                <p className="text-[#646f87] text-base mb-6">
                  ¿Estás seguro de que deseas cerrar sesión? Tendrás que iniciar
                  sesión nuevamente para acceder.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelLogout}
                    className="px-5 py-2.5 rounded-xl bg-[#f0f2f4] text-[#111317] text-sm font-bold hover:bg-[#e0e2e4] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="px-5 py-2.5 rounded-xl bg-[#1d56c9] text-white text-sm font-bold hover:bg-[#1448a8] transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#111317] tracking-light text-[32px] font-bold leading-tight min-w-72">
                Dashboard
              </p>
            </div>

            <div className="flex gap-3 p-3 flex-wrap pr-4">
              {['24h', '7d', '30d'].map((t) => (
                <div
                  key={t}
                  className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#f0f2f4] pl-4 pr-4"
                >
                  <p className="text-[#111317] text-sm font-medium leading-normal">
                    {t}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 p-3 flex-wrap pr-4">
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#f0f2f4] pl-4 pr-4">
                <p className="text-[#111317] text-sm font-medium leading-normal">
                  Filtros Guardados
                </p>
              </div>
            </div>

            {/* KPIs */}
            <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Indicadores Clave de Desempeño
            </h2>
            <div className="flex flex-wrap gap-4 p-4">
              {[
                {
                  title: 'Buses Activos',
                  val: '120',
                  delta: '+10%',
                  deltaColor: '#07883b',
                },
                {
                  title: 'Ocupación Promedio %',
                  val: '85%',
                  delta: '-5%',
                  deltaColor: '#e73908',
                },
                {
                  title: 'Rutas en Servicio',
                  val: '100',
                  delta: '+20%',
                  deltaColor: '#07883b',
                },
                {
                  title: 'Incidentes Abiertos',
                  val: '5',
                  delta: '-2',
                  deltaColor: '#e73908',
                },
                {
                  title: 'Tasa de Puntualidad %',
                  val: '98%',
                  delta: '+1%',
                  deltaColor: '#07883b',
                },
                {
                  title: 'Actualización Telemetría',
                  val: '5 min',
                  delta: '-1 min',
                  deltaColor: '#e73908',
                },
              ].map((k) => (
                <div
                  key={k.title}
                  className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dcdfe5]"
                >
                  <p className="text-[#111317] text-base font-medium leading-normal">
                    {k.title}
                  </p>
                  <p className="text-[#111317] tracking-light text-2xl font-bold leading-tight">
                    {k.val}
                  </p>
                  <p
                    className="text-base font-medium leading-normal"
                    style={{ color: k.deltaColor }}
                  >
                    {k.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Trends */}
            <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Tendencias
            </h2>
            <div className="flex flex-wrap gap-4 px-4 py-6">
              <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#dcdfe5] p-6">
                <p className="text-[#111317] text-base font-medium leading-normal">
                  Ocupación en el Tiempo
                </p>
                <div className="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
                  <svg
                    width="100%"
                    height="148"
                    viewBox="-3 0 478 150"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z"
                      fill="url(#paint0_linear_1131_5935)"
                    />
                    <path
                      d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                      stroke="#646f87"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_1131_5935"
                        x1="236"
                        y1="1"
                        x2="236"
                        y2="149"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#f0f2f4" />
                        <stop offset="1" stopColor="#f0f2f4" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex justify-around text-[#646f87] text-[13px] font-bold tracking-[0.015em]">
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map(
                      (m) => (
                        <p key={m}>{m}</p>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Bars */}
              <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#dcdfe5] p-6">
                <p className="text-[#111317] text-base font-medium leading-normal">
                  Utilización por Ruta
                </p>
                <div className="grid min-h-[180px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center px-3">
                  {[
                    { h: '80%', label: 'Ruta A' },
                    { h: '40%', label: 'Ruta B' },
                    { h: '60%', label: 'Ruta C' },
                  ].map((b) => (
                    <>
                      <div
                        key={b.label + 'bar'}
                        className="border-[#646f87] bg-[#f0f2f4] border-t-2 w-full"
                        style={{ height: b.h }}
                      ></div>
                      <p
                        key={b.label + 'lbl'}
                        className="text-[#646f87] text-[13px] font-bold leading-normal tracking-[0.015em]"
                      >
                        {b.label}
                      </p>
                    </>
                  ))}
                </div>
              </div>

              <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#dcdfe5] p-6">
                <p className="text-[#111317] text-base font-medium leading-normal">
                  Incidentes por Tipo
                </p>
                <div className="grid min-h-[180px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center px-3">
                  {[
                    { h: '40%', label: 'Tipo A' },
                    { h: '30%', label: 'Tipo B' },
                    { h: '90%', label: 'Tipo C' },
                  ].map((b) => (
                    <>
                      <div
                        key={b.label + 'bar'}
                        className="border-[#646f87] bg-[#f0f2f4] border-t-2 w-full"
                        style={{ height: b.h }}
                      ></div>
                      <p
                        key={b.label + 'lbl'}
                        className="text-[#646f87] text-[13px] font-bold leading-normal tracking-[0.015em]"
                      >
                        {b.label}
                      </p>
                    </>
                  ))}
                </div>
              </div>
            </div>

            {/* Situational Awareness */}
            <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Conciencia Situacional
            </h2>
            <div className="flex px-4 py-3">
              <div
                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl object-cover"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC8d3z0Y-BG6s3vIYI63i9sXffKWr5BzXe6-AH03YiIu1xbEIAFAvq2OudbiZsUH5d9VcF3AA0gkFP9rapJbohree9oWoEpo-yRyZvp1bOVipZz2JqGBrdpieB_WjYhaXy-xEW5n-6xh7ctsm_-1idlj7pSGMPFU2L4gs6qx7fdMbyJbx6O8shfNQ5xkHTCDLhWpImc_XOj2s3Tc20Ds9b3cDnuJB8XIMSI1zufatxmhhEX_s6etNLYdDIMyt_ARmzSCD19k5AMnx5q")',
                }}
              ></div>
            </div>

            {[
              {
                iconPath:
                  'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z',
                title: 'Incidente: Congestión de Tráfico',
                sub1: 'Retrasado por 15 minutos',
                sub2: 'Vehículo 123 - Ruta A',
              },
              {
                iconPath:
                  'M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z',
                title: 'Incidente: Llanta Ponchada',
                sub1: 'Resuelto',
                sub2: 'Vehículo 456 - Ruta B',
              },
              {
                iconPath:
                  'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z',
                title: 'Incidente: Problema Mecánico',
                sub1: 'En Curso',
                sub2: 'Vehículo 789 - Ruta C',
              },
            ].map((i, idx) => (
              <div key={idx} className="flex gap-4 bg-white px-4 py-3">
                <div className="text-[#111317] flex items-center justify-center rounded-lg bg-[#f0f2f4] shrink-0 size-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d={i.iconPath}></path>
                  </svg>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="text-[#111317] text-base font-medium leading-normal">
                    {i.title}
                  </p>
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    {i.sub1}
                  </p>
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    {i.sub2}
                  </p>
                </div>
              </div>
            ))}

            {/* Table */}
            <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Principales Retrasos / Riesgos SLA
            </h2>
            <div className="px-4 py-3 [container-type:inline-size]">
              <div className="flex overflow-hidden rounded-xl border border-[#dcdfe5] bg-white">
                <table className="flex-1">
                  <thead>
                    <tr className="bg-white">
                      <th className="table-col-120 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Ruta
                      </th>
                      <th className="table-col-240 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        % A Tiempo
                      </th>
                      <th className="table-col-360 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Retraso Promedio
                      </th>
                      <th className="table-col-480 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Vehículos Afectados
                      </th>
                      <th className="table-col-600 px-4 py-3 text-left text-[#111317] w-[400px] text-sm font-medium leading-normal">
                        Tendencia
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Ruta A', '95%', '5 min', '2', 'Aumentando'],
                      ['Ruta B', '90%', '10 min', '3', 'Disminuyendo'],
                      ['Ruta C', '85%', '15 min', '1', 'Estable'],
                    ].map((row, i) => (
                      <tr key={i} className="border-t border-t-[#dcdfe5]">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`h-[72px] px-4 py-2 w-[400px] text-sm font-normal leading-normal ${j === 0 ? 'text-[#111317]' : 'text-[#646f87]'} table-col-${(j + 1) * 120}`}
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
                @container(max-width:120px){.table-col-120{display:none}}
                @container(max-width:240px){.table-col-240{display:none}}
                @container(max-width:360px){.table-col-360{display:none}}
                @container(max-width:480px){.table-col-480{display:none}}
                @container(max-width:600px){.table-col-600{display:none}}
              `}</style>
            </div>

            {/* Severity */}
            <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Incidentes Abiertos por Severidad
            </h2>
            <div className="flex flex-wrap gap-4 px-4 py-6">
              <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border border-[#dcdfe5] p-6">
                <p className="text-[#111317] text-base font-medium leading-normal">
                  Incidentes por Severidad
                </p>
                <div className="grid min-h-[180px] gap-x-4 gap-y-6 grid-cols-[auto_1fr] items-center py-3">
                  {[
                    ['Alta', '50%'],
                    ['Media', '90%'],
                    ['Baja', '80%'],
                  ].map(([label, width]) => (
                    <>
                      <p
                        key={label + 'lbl'}
                        className="text-[#646f87] text-[13px] font-bold leading-normal tracking-[0.015em]"
                      >
                        {label}
                      </p>
                      <div key={label + 'bar'} className="h-full flex-1">
                        <div
                          className="border-[#646f87] bg-[#f0f2f4] border-r-2 h-full"
                          style={{ width }}
                        ></div>
                      </div>
                    </>
                  ))}
                </div>
              </div>
            </div>

            {[
              {
                title: 'Incidente: Falla del Motor',
                sub1: 'Severidad Alta',
                sub2: 'Vehículo 123 - Ruta A',
              },
              {
                title: 'Incidente: Accidente',
                sub1: 'Severidad Media',
                sub2: 'Vehículo 456 - Ruta B',
              },
              {
                title: 'Incidente: Retraso Menor',
                sub1: 'Severidad Baja',
                sub2: 'Vehículo 789 - Ruta C',
              },
            ].map((i, idx) => (
              <div key={idx} className="flex gap-4 bg-white px-4 py-3">
                <div className="text-[#111317] flex items-center justify-center rounded-lg bg-[#f0f2f4] shrink-0 size-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"></path>
                  </svg>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="text-[#111317] text-base font-medium leading-normal">
                    {i.title}
                  </p>
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    {i.sub1}
                  </p>
                  <p className="text-[#646f87] text-sm font-normal leading-normal">
                    {i.sub2}
                  </p>
                </div>
              </div>
            ))}

            {/* Gauges (simple cards) */}
            <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Indicadores de Salud de la Flota
            </h2>
            <div className="flex flex-wrap gap-4 p-4">
              {[
                ['Tiempo Activo', '99.9%'],
                ['% Señal GPS OK', '98%'],
                ['Frescura Datos P95', '2 min'],
              ].map(([title, val]) => (
                <div
                  key={title}
                  className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dcdfe5]"
                >
                  <p className="text-[#111317] text-base font-medium leading-normal">
                    {title}
                  </p>
                  <p className="text-[#111317] tracking-light text-2xl font-bold leading-tight">
                    {val}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h2 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Acciones Rápidas
            </h2>
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#1d56c9] text-white text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Crear Incidente</span>
                </button>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Asignar Vehículos a Ruta</span>
                </button>
              </div>
            </div>

            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Exportar Reporte Diario</span>
                </button>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f0f2f4] text-[#111317] text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Programar Reporte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
