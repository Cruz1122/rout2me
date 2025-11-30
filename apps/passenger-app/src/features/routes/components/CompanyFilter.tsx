import { useState, useRef, useEffect } from 'react';
import {
  RiBuilding2Line,
  RiBuilding2Fill,
  RiArrowDownSLine,
} from 'react-icons/ri';
import { type CompanyInfo } from '../services/busService';

interface CompanyFilterProps {
  readonly companies: readonly CompanyInfo[];
  readonly selectedCompanyId: string | null;
  readonly onCompanyChange: (companyId: string | null) => void;
}

export default function CompanyFilter({
  companies,
  selectedCompanyId,
  onCompanyChange,
}: CompanyFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const selectedCompany = companies.find(
    (company) => company.id === selectedCompanyId,
  );

  const handleSelectCompany = (companyId: string | null) => {
    onCompanyChange(companyId);
    setIsOpen(false);
  };

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Botón selector - Normalizado para coincidir con barra de búsqueda */}
      <div
        className="flex items-center rounded-xl"
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid rgba(var(--color-terciary-rgb), 0.3)',
          borderRadius: '16px',
        }}
      >
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between h-12 rounded-xl text-base font-medium transition-all duration-200 focus:outline-none"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text)',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              style={{
                color: 'var(--color-primary)',
                flexShrink: 0,
                paddingRight: '4px',
              }}
            >
              {selectedCompanyId ? (
                <RiBuilding2Fill size={20} />
              ) : (
                <RiBuilding2Line size={20} />
              )}
            </div>
            <span className="truncate" style={{ paddingLeft: '4px' }}>
              {selectedCompany ? selectedCompany.name : 'Todas las empresas'}
            </span>
          </div>
          <div
            className="transition-transform duration-200 flex-shrink-0"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'var(--color-terciary)',
              marginLeft: '12px',
            }}
          >
            <RiArrowDownSLine size={20} />
          </div>
        </button>
      </div>

      {/* Dropdown con animación hacia abajo */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-lg z-50 max-h-52 overflow-y-auto animate-slide-down overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--color-shadow)',
          }}
        >
          {/* Opción "Todas las empresas" */}
          <button
            onClick={() => handleSelectCompany(null)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-opacity-50 focus:outline-none min-h-[52px]"
            style={{
              backgroundColor:
                selectedCompanyId === null
                  ? 'rgba(var(--color-primary-rgb), 0.1)'
                  : 'transparent',
              color: 'var(--color-text)',
            }}
            onMouseEnter={(e) => {
              if (selectedCompanyId !== null) {
                const isDark =
                  document.documentElement.getAttribute('data-theme') ===
                  'dark';
                e.currentTarget.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCompanyId !== null) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div
              style={{
                color: 'var(--color-primary)',
                flexShrink: 0,
                paddingRight: '10px',
                paddingLeft: '15px',
              }}
            >
              <RiBuilding2Line size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-base truncate leading-tight"
                style={{ color: 'var(--color-text)' }}
              >
                Todas las empresas
              </div>
            </div>
          </button>

          {/* Lista de empresas */}
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-opacity-50 border-t focus:outline-none min-h-[52px]"
              style={{
                backgroundColor:
                  selectedCompanyId === company.id
                    ? 'rgba(var(--color-primary-rgb), 0.1)'
                    : 'transparent',
                borderTopColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              onMouseEnter={(e) => {
                if (selectedCompanyId !== company.id) {
                  const isDark =
                    document.documentElement.getAttribute('data-theme') ===
                    'dark';
                  e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCompanyId !== company.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div
                style={{
                  color: 'var(--color-primary)',
                  flexShrink: 0,
                  paddingRight: '10px',
                  paddingLeft: '15px',
                }}
              >
                <RiBuilding2Fill size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-base truncate leading-tight"
                  style={{ color: 'var(--color-text)' }}
                >
                  {company.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
