interface FilterOption<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly icon?: string; // Remix Icon class
}

interface R2MFilterSwitcherProps<T extends string> {
  readonly options: readonly FilterOption<T>[];
  readonly activeFilter: T | null;
  readonly onFilterChange: (filter: T | null) => void;
  readonly allowDeselect?: boolean;
}

export default function R2MFilterSwitcher<T extends string>({
  options,
  activeFilter,
  onFilterChange,
  allowDeselect = false,
}: R2MFilterSwitcherProps<T>) {
  const handleClick = (filterId: T) => {
    // Si el filtro ya está activo y se permite deseleccionar, lo deseleccionamos
    const shouldDeselect = allowDeselect && activeFilter === filterId;
    onFilterChange(shouldDeselect ? null : filterId);
  };

  return (
    <div className="flex h-10 items-center justify-center rounded-xl bg-[#f0f2f4] p-1">
      {options.map((filter) => {
        const isSelected = activeFilter === filter.id;

        return (
          <label
            key={filter.id}
            className={`flex cursor-pointer h-full grow items-center justify-center gap-2 overflow-hidden rounded-xl px-2 text-sm font-medium leading-normal transition-all ${
              isSelected
                ? 'bg-white shadow-[0_0_4px_rgba(0,0,0,0.1)] text-[#111317]'
                : 'text-[#646f87] hover:text-[#111317]'
            }`}
          >
            {filter.icon && (
              <i
                className={`${filter.icon} text-base transition-transform ${isSelected ? 'scale-110' : 'scale-100'}`}
              ></i>
            )}
            <span className="truncate">{filter.label}</span>
            <input
              type="radio"
              className="sr-only"
              checked={isSelected}
              onChange={() => handleClick(filter.id)}
            />
          </label>
        );
      })}
    </div>
  );
}

export type { FilterOption };
