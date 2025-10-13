import { useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { SearchItem, SearchFilters } from '../types/search';
import { mockSearchData } from '../data/mocks';
import { useDebounce } from './useDebounce';

const fuseOptions = {
  keys: ['name', 'code', 'tags', 'type'],
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 1,
};

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    onlyStops: false,
    onlyRoutes: false,
  });
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Crear instancia de Fuse memoizada
  const fuse = useMemo(() => new Fuse(mockSearchData, fuseOptions), []);

  // Función de búsqueda con filtros
  const performSearch = useCallback(
    (term: string, currentFilters: SearchFilters) => {
      if (!term.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      // Ejecutar búsqueda con Fuse
      const fuseResults = fuse.search(term);

      // Aplicar filtros adicionales
      let filteredResults = fuseResults.map((result) => result.item);

      // Filtros mutuamente excluyentes
      if (currentFilters.onlyStops && !currentFilters.onlyRoutes) {
        filteredResults = filteredResults.filter(
          (item) => item.type === 'stop',
        );
      } else if (currentFilters.onlyRoutes && !currentFilters.onlyStops) {
        filteredResults = filteredResults.filter(
          (item) => item.type === 'route',
        );
      }

      // Filtro de fare range para rutas
      if (currentFilters.fareRange) {
        filteredResults = filteredResults.filter((item) => {
          if (item.type === 'route' && 'fare' in item) {
            const fare = item.fare || 0;
            return (
              fare >= (currentFilters.fareRange?.min || 0) &&
              fare <= (currentFilters.fareRange?.max || Number.MAX_VALUE)
            );
          }
          return item.type === 'stop'; // Incluir paraderos cuando hay filtro de fare
        });
      }

      // Limitar resultados y ordenar por score
      const limitedResults = filteredResults.slice(0, 20);

      setResults(limitedResults);
      setIsSearching(false);
    },
    [fuse],
  );

  // Debounced search
  const debouncedSearch = useDebounce(performSearch, 300);

  const updateSearchTerm = useCallback(
    (term: string) => {
      setSearchTerm(term);
      debouncedSearch(term, filters);
    },
    [debouncedSearch, filters],
  );

  const updateFilters = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters);
      if (searchTerm.trim()) {
        debouncedSearch(searchTerm, newFilters);
      }
    },
    [debouncedSearch, searchTerm],
  );

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setIsSearching(false);
  }, []);

  return {
    searchTerm,
    results,
    isSearching,
    filters,
    updateSearchTerm,
    updateFilters,
    clearSearch,
  };
}
