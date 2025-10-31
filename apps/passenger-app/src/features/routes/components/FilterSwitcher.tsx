interface FilterOption<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly iconOutline: React.ComponentType<{ size?: number }>;
  readonly iconFilled: React.ComponentType<{ size?: number }>;
}

interface FilterSwitcherProps<T extends string> {
  readonly options: readonly FilterOption<T>[];
  readonly activeFilter: T | null;
  readonly onFilterChange: (filter: T | null) => void;
  readonly allowDeselect?: boolean;
}

export default function FilterSwitcher<T extends string>({
  options,
  activeFilter,
  onFilterChange,
  allowDeselect = false,
}: FilterSwitcherProps<T>) {
  const handleClick = (filterId: T) => {
    // Si el filtro ya está activo y se permite deseleccionar, lo deseleccionamos
    const shouldDeselect = allowDeselect && activeFilter === filterId;
    onFilterChange(shouldDeselect ? null : filterId);
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-xl p-1.5 gap-1.5">
      {options.map((filter) => {
        const IconOutline = filter.iconOutline;
        const IconFilled = filter.iconFilled;
        const isSelected = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => handleClick(filter.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
            style={{
              color: isSelected
                ? 'rgb(var(--color-primary-rgb))'
                : 'rgb(107, 114, 128)',
            }}
          >
            <div className="relative w-5 h-5">
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  opacity: isSelected ? 0 : 1,
                  transform: isSelected
                    ? 'scale(0.8) rotate(-90deg)'
                    : 'scale(1) rotate(0deg)',
                }}
              >
                <IconOutline size={20} />
              </div>
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  opacity: isSelected ? 1 : 0,
                  transform: isSelected
                    ? 'scale(1) rotate(0deg)'
                    : 'scale(0.8) rotate(90deg)',
                }}
              >
                <IconFilled size={20} />
              </div>
            </div>
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { FilterOption };
