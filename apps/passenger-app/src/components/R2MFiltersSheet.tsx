import { useEffect, useRef, useCallback } from 'react';
import type { R2MFiltersSheetProps } from '../types/search';

export default function R2MFiltersSheet({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: Readonly<R2MFiltersSheetProps>) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  // Focus trap
  const handleTabKey = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab') return;

      const focusableElements = sheetRef.current?.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [isOpen],
  );

  // Event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleTabKey);

      // Focus first element
      setTimeout(() => {
        const firstFocusable = sheetRef.current?.querySelector(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen, handleKeyDown, handleTabKey]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleMutuallyExclusiveChange = (
    filterType: 'onlyStops' | 'onlyRoutes',
    value: boolean,
  ) => {
    if (value) {
      // Si activamos uno, desactivamos el otro
      onFiltersChange({
        ...filters,
        onlyStops: filterType === 'onlyStops',
        onlyRoutes: filterType === 'onlyRoutes',
      });
    } else {
      // Si desactivamos, solo desactivamos ese filtro
      onFiltersChange({
        ...filters,
        [filterType]: false,
      });
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      onlyStops: false,
      onlyRoutes: false,
      fareRange: undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 
                 r2m-sheet-backdrop transition-opacity duration-300"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-title"
    >
      <div
        ref={sheetRef}
        className={`
          w-full max-w-lg bg-white rounded-t-3xl shadow-xl transform transition-transform duration-300
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '70vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2
            id="filters-title"
            className="text-xl font-semibold text-gray-900"
          >
            Filtros de Búsqueda
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 
                       transition-colors duration-200"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: 'calc(70vh - 140px)' }}
        >
          {/* Type Filters */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Tipo de Resultado
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyStops}
                  onChange={(e) =>
                    handleMutuallyExclusiveChange('onlyStops', e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Solo Paraderos</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyRoutes}
                  onChange={(e) =>
                    handleMutuallyExclusiveChange(
                      'onlyRoutes',
                      e.target.checked,
                    )
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Solo Rutas</span>
              </label>
            </div>
          </div>

          {/* Fare Range */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Rango de Tarifa (solo rutas)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="fare-min"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Desde
                </label>
                <input
                  id="fare-min"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="2000"
                  value={filters.fareRange?.min || ''}
                  onChange={(e) =>
                    handleFilterChange('fareRange', {
                      ...filters.fareRange,
                      min: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="fare-max"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hasta
                </label>
                <input
                  id="fare-max"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="5000"
                  value={filters.fareRange?.max || ''}
                  onChange={(e) =>
                    handleFilterChange('fareRange', {
                      ...filters.fareRange,
                      max: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium 
                       transition-colors duration-200"
          >
            Limpiar Todo
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg 
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:ring-offset-2 transition-colors duration-200"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
