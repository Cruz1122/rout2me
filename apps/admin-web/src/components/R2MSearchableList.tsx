import { useState } from 'react';
import R2MSearchInput from './R2MSearchInput';

interface R2MSearchableListProps<T> {
  readonly items: T[];
  readonly searchPlaceholder?: string;
  readonly searchKey: keyof T;
  readonly onItemClick?: (item: T) => void;
  readonly renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  readonly selectedItemId?: string | null;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly height?: string; // Altura personalizada para el contenedor
  readonly itemsPerPage?: number; // Número de items por página
}

export default function R2MSearchableList<T extends { id: string }>({
  items,
  searchPlaceholder = 'Buscar...',
  searchKey,
  onItemClick,
  renderItem,
  selectedItemId,
  loading = false,
  emptyMessage = 'No se encontraron elementos',
  height = '600px',
  itemsPerPage = 8,
}: Readonly<R2MSearchableListProps<T>>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar items por búsqueda
  const filteredItems = items.filter((item) => {
    const value = item[searchKey];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return false;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset a la primera página cuando cambia la búsqueda
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col" style={{ height }}>
      {/* Buscador */}
      <div className="px-4 py-3">
        <R2MSearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-[#646f87]">Cargando...</p>
          </div>
        )}
        {!loading && currentItems.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-[#646f87]">{emptyMessage}</p>
          </div>
        )}
        {!loading && currentItems.length > 0 && (
          <>
            {currentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="cursor-pointer w-full text-left"
                type="button"
              >
                {renderItem(item, selectedItemId === item.id)}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="border-t border-[#dcdfe5] bg-white">
          <div className="flex items-center justify-center px-4 py-2 border-b border-[#dcdfe5]">
            <div className="text-sm text-[#646f87]">
              Mostrando {startIndex + 1} -{' '}
              {Math.min(endIndex, filteredItems.length)} de{' '}
              {filteredItems.length}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#f0f2f4] text-[#111317] hover:bg-[#e5e7eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Mostrar solo páginas cercanas a la actual
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-[#1E56A0] text-white'
                            : 'bg-[#f0f2f4] text-[#111317] hover:bg-[#e5e7eb]'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-[#646f87]">
                        ...
                      </span>
                    );
                  }
                  return null;
                },
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#f0f2f4] text-[#111317] hover:bg-[#e5e7eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
