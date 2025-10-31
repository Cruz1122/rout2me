export default function HomePage() {
  return (
    <>
      {/* Main content */}
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
              {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map((m) => (
                <p key={m}>{m}</p>
              ))}
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
    </>
  );
}
