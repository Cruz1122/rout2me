import { useState } from 'react';

// Iconos SVG como componentes
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24px"
    height="24px"
    fill="currentColor"
    viewBox="0 0 256 256"
  >
    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
  </svg>
);

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
        <div className="flex h-12 w-full min-w-40">
          <div className="flex h-full w-full flex-1 items-stretch rounded-xl">
            <div className="flex items-center justify-center rounded-l-xl border-r-0 bg-[#f0f2f4] pl-4 text-[#646f87]">
              <SearchIcon />
            </div>
            <input
              placeholder={searchPlaceholder}
              className="form-input flex h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl rounded-l-none border-l-0 border-none bg-[#f0f2f4] px-4 pl-2 text-base font-normal leading-normal text-[#111317] placeholder:text-[#646f87] focus:border-none focus:outline-0 focus:ring-0"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label={searchPlaceholder}
            />
          </div>
        </div>
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
