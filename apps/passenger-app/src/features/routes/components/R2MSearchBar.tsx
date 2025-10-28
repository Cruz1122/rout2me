import { useRef, useState, useEffect, useCallback } from 'react';
import {
  RiFilterLine,
  RiFilterFill,
  RiMapPinLine,
  RiMapPinFill,
  RiBusLine,
  RiBusFill,
  RiGridLine,
  RiGridFill,
} from 'react-icons/ri';
import { IoSearchOutline, IoSearch } from 'react-icons/io5';
import type { R2MSearchBarProps } from '../../../shared/types/search';
import FilterSwitcher, { type FilterOption } from './FilterSwitcher';

type FilterType = 'all' | 'stops' | 'routes';

const FILTER_OPTIONS: readonly FilterOption<FilterType>[] = [
  {
    id: 'all',
    label: 'Todos',
    iconOutline: RiGridLine,
    iconFilled: RiGridFill,
  },
  {
    id: 'stops',
    label: 'Paraderos',
    iconOutline: RiMapPinLine,
    iconFilled: RiMapPinFill,
  },
  {
    id: 'routes',
    label: 'Rutas',
    iconOutline: RiBusLine,
    iconFilled: RiBusFill,
  },
] as const;

interface R2MCleanSearchBarProps extends R2MSearchBarProps {
  readonly showFilters?: boolean;
  readonly onToggleFilters?: () => void;
  readonly onFilterTypeChange?: (type: FilterType) => void;
  readonly onFareRangeChange?: (
    min: number | undefined,
    max: number | undefined,
  ) => void;
}

export default function R2MSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar paraderos y rutas...',
  onFilterClick,
  showFilters = false,
  onToggleFilters,
  onFilterTypeChange,
  onFareRangeChange,
}: R2MCleanSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [fareMin, setFareMin] = useState<string>('');
  const [fareMax, setFareMax] = useState<string>('');
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [shouldRenderFilters, setShouldRenderFilters] = useState(false);

  const openFilters = useCallback(() => {
    setShouldRenderFilters(true);
    setIsFilterClosing(false);
  }, []);

  const closeFilters = useCallback(() => {
    if (!shouldRenderFilters) return;

    setIsFilterClosing(true);
    const timer = setTimeout(() => {
      setShouldRenderFilters(false);
      setIsFilterClosing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [shouldRenderFilters]);

  // Manejo de animación de apertura de filtros
  useEffect(() => {
    if (!showFilters && !shouldRenderFilters) {
      return;
    }

    if (showFilters) {
      openFilters();
    } else {
      closeFilters();
    }
  }, [showFilters, shouldRenderFilters, openFilters, closeFilters]);

  const handleFocus = () => {
    setIsFocused(true);
    setIsExpanded(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value.trim()) {
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onChange('');
      inputRef.current?.blur();
      setIsExpanded(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  const handleFilterToggle = () => {
    if (onToggleFilters) {
      onToggleFilters();
    }
    if (onFilterClick) {
      onFilterClick();
    }
  };

  const handleTypeChange = (type: FilterType | null) => {
    const newType = type || 'all';
    setSelectedType(newType);
    onFilterTypeChange?.(newType);
  };

  const handleFareChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value);

    if (type === 'min') {
      setFareMin(value);
      onFareRangeChange?.(
        numValue,
        fareMax === '' ? undefined : parseInt(fareMax),
      );
    } else {
      setFareMax(value);
      onFareRangeChange?.(
        fareMin === '' ? undefined : parseInt(fareMin),
        numValue,
      );
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            relative flex items-center transition-all duration-500 cubic-bezier(0.4, 0.0, 0.2, 1)
            bg-white backdrop-blur-lg rounded-2xl
          `}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid rgba(var(--color-surface-rgb), 0.3)`,
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {/* Search Icon - Animated */}
          <div
            className={`
              absolute left-4 transition-all duration-300 ease-in-out
              ${isFocused || value ? 'scale-110' : 'scale-100'}
            `}
            style={{
              color:
                isFocused || value
                  ? 'rgb(var(--color-primary-rgb))'
                  : 'rgb(107, 114, 128)',
            }}
          >
            {isFocused || value ? (
              <IoSearch size={20} />
            ) : (
              <IoSearchOutline size={20} />
            )}
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // Cerrar filtros cuando se escriba en el buscador
              if (showFilters && onToggleFilters) {
                onToggleFilters();
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            aria-label="Buscar paraderos y rutas"
            className={`
              w-full h-14 pl-12 pr-16 bg-transparent
              focus:outline-none transition-all duration-300 ease-in-out
              ${isExpanded ? 'rounded-2xl' : 'rounded-full'}
            `}
          />

          {/* Filter Button */}
          <button
            type="button"
            onClick={handleFilterToggle}
            aria-label={showFilters ? 'Cerrar filtros' : 'Abrir filtros'}
            className="absolute right-3 p-2 transition-all duration-300 ease-in-out focus:outline-none"
            style={{
              transform: showFilters
                ? 'rotate(180deg) scale(1.1)'
                : 'rotate(0deg) scale(1)',
              color: showFilters
                ? 'rgb(var(--color-primary-rgb))'
                : 'rgb(107, 114, 128)',
            }}
          >
            {showFilters ? (
              <RiFilterFill size={18} />
            ) : (
              <RiFilterLine size={18} />
            )}
          </button>
        </div>

        {/* Filters Dropdown - Inline */}
        {shouldRenderFilters && (
          <div
            className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl 
                       overflow-hidden z-50 w-full ${isFilterClosing ? 'animate-slide-up-fade' : 'animate-slide-down'}`}
            style={{
              border: `1px solid rgba(var(--color-surface-rgb), 0.5)`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="p-4">
              <div className="space-y-3">
                {/* Switcher con iconos animados */}
                <FilterSwitcher
                  options={FILTER_OPTIONS}
                  activeFilter={selectedType}
                  onFilterChange={handleTypeChange}
                />

                <div className="border-t border-gray-100 pt-3">
                  <div className="block text-xs font-medium text-gray-600 mb-3">
                    Rango de Tarifa (COP)
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex-1">
                      <label
                        htmlFor="fare-min"
                        className="block text-xs text-gray-500 mb-1"
                      >
                        Mínimo
                      </label>
                      <input
                        id="fare-min"
                        type="number"
                        placeholder="0"
                        value={fareMin}
                        onChange={(e) =>
                          handleFareChange('min', e.target.value)
                        }
                        aria-label="Tarifa mínima"
                        className="w-full px-3 py-2.5 border rounded-lg text-sm
                                 focus:outline-none focus:ring-2 transition-all duration-200"
                        style={
                          {
                            '--tw-ring-color':
                              'rgba(var(--color-primary-rgb), 0.3)',
                            borderColor: 'rgba(var(--color-surface-rgb), 0.5)',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          } as React.CSSProperties
                        }
                      />
                    </div>

                    <div className="hidden sm:flex items-center justify-center px-2">
                      <div className="w-4 h-px bg-gray-300"></div>
                    </div>

                    <div className="flex-1">
                      <label
                        htmlFor="fare-max"
                        className="block text-xs text-gray-500 mb-1"
                      >
                        Máximo
                      </label>
                      <input
                        id="fare-max"
                        type="number"
                        placeholder="10000"
                        value={fareMax}
                        onChange={(e) =>
                          handleFareChange('max', e.target.value)
                        }
                        aria-label="Tarifa máxima"
                        className="w-full px-3 py-2.5 border rounded-lg text-sm
                                 focus:outline-none focus:ring-2 transition-all duration-200"
                        style={
                          {
                            '--tw-ring-color':
                              'rgba(var(--color-primary-rgb), 0.3)',
                            borderColor: 'rgba(var(--color-surface-rgb), 0.5)',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
