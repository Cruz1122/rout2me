import { useState } from 'react';
import { colorClasses } from '../styles/colors';
import R2MFilterSwitcher from './R2MFilterSwitcher';

export type SortDirection = 'asc' | 'desc' | null;

export interface R2MTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean; // Para responsive
}

export interface R2MTableProps<T> {
  readonly data: T[];
  readonly columns: R2MTableColumn<T>[];
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly onRowClick?: (item: T) => void;
  readonly getRowKey: (item: T) => string;
  readonly defaultRowsPerPage?: number;
  readonly rowsPerPageOptions?: number[];
  readonly actions?: (item: T) => React.ReactNode;
  readonly searchable?: boolean;
  readonly onSearch?: (query: string) => void;
}

export default function R2MTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  getRowKey,
  defaultRowsPerPage = 5,
  rowsPerPageOptions = [5, 10, 15, 20],
  actions,
}: R2MTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Función para ordenar datos
  const sortData = (dataToSort: T[]) => {
    if (!sortColumn || !sortDirection) return dataToSort;

    return [...dataToSort].sort((a, b) => {
      const aValue = (a as any)[sortColumn];
      const bValue = (b as any)[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Manejar click en header para ordenar
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      // Cambiar dirección: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset a primera página al ordenar
  };

  // Datos ordenados y paginados
  const sortedData = sortData(data);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Renderizar icono de ordenamiento
  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <i className="ri-arrow-up-down-line text-sm opacity-40 ml-1"></i>;
    }
    if (sortDirection === 'asc') {
      return <i className="ri-arrow-up-line text-sm ml-1"></i>;
    }
    if (sortDirection === 'desc') {
      return <i className="ri-arrow-down-line text-sm ml-1"></i>;
    }
    return null;
  };

  return (
    <div className="flex flex-col">
      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-[#dcdfe5] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${colorClasses.bgSurface}`}>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-center ${colorClasses.textPrimary} text-sm font-semibold ${
                      column.sortable
                        ? 'cursor-pointer select-none hover:bg-[#c0d4e6]'
                        : ''
                    } ${column.className || ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-center">
                      <span>{column.header}</span>
                      {column.sortable && renderSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th
                    className={`px-4 py-3 text-center ${colorClasses.textPrimary} text-sm font-semibold w-[160px]`}
                  >
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="h-[400px] p-0"
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E56A0]"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="h-[200px] px-4 py-2 text-center text-[#97A3B1] text-sm"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={getRowKey(item)}
                    className={`border-t border-[#dcdfe5] transition-colors ${
                      onRowClick
                        ? 'cursor-pointer hover:bg-[#F6F6F6]'
                        : 'hover:bg-[#F6F6F6]'
                    }`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${getRowKey(item)}-${column.key}`}
                        className={`px-4 py-3 text-sm text-center ${column.className || ''}`}
                      >
                        {column.render
                          ? column.render(item)
                          : String((item as any)[column.key] ?? 'N/A')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actions(item)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {!loading && paginatedData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 my-3 border-t border-[#dcdfe5]">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#97A3B1]">Filas por página:</span>
            <R2MFilterSwitcher
              options={rowsPerPageOptions.map((option) => ({
                id: String(option),
                label: String(option),
              }))}
              activeFilter={String(rowsPerPage)}
              onFilterChange={(filter) => {
                setRowsPerPage(Number(filter));
                setCurrentPage(1);
              }}
              allowDeselect={false}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#97A3B1]">
              {startIndex + 1}-{Math.min(endIndex, sortedData.length)} de{' '}
              {sortedData.length}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                currentPage === 1
                  ? 'opacity-30 cursor-not-allowed text-[#97A3B1]'
                  : `${colorClasses.textPrimary} hover:bg-[#D6E4F0]`
              }`}
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage >= totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                currentPage >= totalPages
                  ? 'opacity-30 cursor-not-allowed text-[#97A3B1]'
                  : `${colorClasses.textPrimary} hover:bg-[#D6E4F0]`
              }`}
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
