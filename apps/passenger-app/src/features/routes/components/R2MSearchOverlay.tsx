import { useState, useCallback } from 'react';
import type { SearchItem } from '../../../shared/types/search';
import { useSearch } from '../hooks/useSearch';
import R2MSearchBar from './R2MSearchBar';
import R2MResultsList from './R2MResultsList';

type FilterType = 'all' | 'stops' | 'routes';

interface R2MSearchOverlayProps {
  readonly onItemSelect: (item: SearchItem) => void;
  readonly onLayoutChange?: () => void;
}

export default function R2MSearchOverlay({
  onItemSelect,
  onLayoutChange,
}: R2MSearchOverlayProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const {
    searchTerm,
    results,
    isSearching,
    filters,
    updateSearchTerm,
    updateFilters,
    clearSearch,
  } = useSearch();

  const handleSearchChange = useCallback(
    (value: string) => {
      updateSearchTerm(value);
      setShowResults(value.trim().length > 0);
    },
    [updateSearchTerm],
  );

  const handleSearchSubmit = useCallback(() => {
    if (results.length > 0) {
      onItemSelect(results[0]);
      setShowResults(false);
      clearSearch();
    }
  }, [results, onItemSelect, clearSearch]);

  const handleItemSelect = useCallback(
    (item: SearchItem) => {
      onItemSelect(item);
      setShowResults(false);
      clearSearch();
    },
    [onItemSelect, clearSearch],
  );

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
    onLayoutChange?.();
  }, [onLayoutChange]);

  const handleFilterTypeChange = useCallback(
    (type: FilterType) => {
      const newFilters = {
        ...filters,
        onlyStops: type === 'stops',
        onlyRoutes: type === 'routes',
      };
      updateFilters(newFilters);
    },
    [filters, updateFilters],
  );

  const handleFareRangeChange = useCallback(
    (min: number | undefined, max: number | undefined) => {
      const newFilters = {
        ...filters,
        fareRange:
          min !== undefined || max !== undefined
            ? { min: min || 0, max: max || Number.MAX_VALUE }
            : undefined,
      };
      updateFilters(newFilters);
    },
    [filters, updateFilters],
  );

  return (
    <>
      {/* Search Container */}
      <div className="relative z-50 w-full">
        <R2MSearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          placeholder="Buscar paraderos y rutas..."
          showFilters={showFilters}
          onToggleFilters={handleToggleFilters}
          onFilterTypeChange={handleFilterTypeChange}
          onFareRangeChange={handleFareRangeChange}
        />

        {/* Results List - Only show when not showing inline filters */}
        {!showFilters && (
          <R2MResultsList
            items={results}
            onSelect={handleItemSelect}
            isVisible={showResults && !isSearching}
          />
        )}

        {/* Loading indicator */}
        {isSearching && showResults && !showFilters && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 
                         rounded-xl shadow-lg z-50 p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full r2m-loading-spinner" />
              <span className="text-sm">Buscando...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
