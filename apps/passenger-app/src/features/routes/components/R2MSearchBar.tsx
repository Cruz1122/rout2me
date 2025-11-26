import { useRef, useState, useEffect, useCallback } from 'react';
import {
  RiFilterLine,
  RiFilterFill,
  RiParkingLine,
  RiParkingFill,
  RiBusLine,
  RiBusFill,
  RiGridLine,
  RiGridFill,
} from 'react-icons/ri';
import { IoSearchOutline, IoSearch } from 'react-icons/io5';
import type { R2MSearchBarProps } from '../../../shared/types/search';
import FilterSwitcher, { type FilterOption } from './FilterSwitcher';
import '../../../theme/search.css';

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
    iconOutline: RiParkingLine,
    iconFilled: RiParkingFill,
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
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly inputRef?: React.RefObject<HTMLInputElement | null>;
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
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  inputRef: externalInputRef,
}: R2MCleanSearchBarProps) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [fareMin, setFareMin] = useState<string>('');
  const [fareMax, setFareMax] = useState<string>('');
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [shouldRenderFilters, setShouldRenderFilters] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

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
    onFocusProp?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value.trim()) {
      setIsExpanded(false);
    }
    onBlurProp?.();
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

  const handleFilterMouseDown = () => {
    setIsClicking(true);
  };

  const handleFilterMouseUp = () => {
    setTimeout(() => setIsClicking(false), 150);
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
            backgroundColor: 'var(--color-input-bg)',
            border: `1px solid var(--color-border)`,
            boxShadow: 'var(--color-shadow)',
            transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
            opacity: isFocused || value || isClicking ? 1 : 0.4,
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
                  ? 'var(--color-primary)'
                  : 'var(--color-terciary)',
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
            style={{
              color: 'var(--color-text)',
            }}
          />

          {/* Filter Button */}
          <button
            type="button"
            onClick={handleFilterToggle}
            onMouseDown={handleFilterMouseDown}
            onMouseUp={handleFilterMouseUp}
            onTouchStart={handleFilterMouseDown}
            onTouchEnd={handleFilterMouseUp}
            aria-label={showFilters ? 'Cerrar filtros' : 'Abrir filtros'}
            className="absolute right-3 p-2 transition-all duration-300 ease-in-out focus:outline-none active:scale-95"
            style={{
              transform: showFilters
                ? 'rotate(180deg) scale(1.1)'
                : 'rotate(0deg) scale(1)',
              color:
                showFilters || isClicking
                  ? 'var(--color-primary)'
                  : 'var(--color-terciary)',
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
            className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl 
                       overflow-hidden z-50 w-full ${isFilterClosing ? 'animate-slide-up-fade' : 'animate-slide-down'}`}
            style={{
              backgroundColor: 'var(--color-card)',
              border: `1px solid var(--color-border)`,
              boxShadow: 'var(--color-shadow-lg)',
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

                <div
                  className="pt-3"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <div
                    className="block text-xs font-medium mb-3"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Rango de Tarifa (COP)
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex-1">
                      <label
                        htmlFor="fare-min"
                        className="block text-xs mb-1"
                        style={{ color: 'var(--color-terciary)' }}
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
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'var(--color-input-bg)',
                            color: 'var(--color-text)',
                          } as React.CSSProperties
                        }
                      />
                    </div>

                    <div className="hidden sm:flex items-center justify-center px-2">
                      <div
                        className="w-4 h-px"
                        style={{ backgroundColor: 'var(--color-border)' }}
                      ></div>
                    </div>

                    <div className="flex-1">
                      <label
                        htmlFor="fare-max"
                        className="block text-xs mb-1"
                        style={{ color: 'var(--color-terciary)' }}
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
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'var(--color-input-bg)',
                            color: 'var(--color-text)',
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
