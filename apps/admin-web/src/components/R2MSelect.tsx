import { useState, useRef, useEffect } from 'react';

interface R2MSelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly { value: string; label: string }[];
  readonly placeholder?: string;
  readonly error?: string;
  readonly icon?: string; // Remix Icon class
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onBlur?: () => void;
}

export default function R2MSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccione una opción',
  error,
  icon,
  disabled = false,
  loading = false,
  onBlur,
}: R2MSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onBlur]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const handleOptionClick = (e: React.MouseEvent, optionValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
    setIsFocused(false);
    onBlur?.();
  };

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      setIsFocused(!isOpen);
    }
  };

  const getBorderColor = () => {
    if (error) return '#ef4444';
    if (isFocused || isOpen) return '#1E56A0';
    return '#dcdfe5';
  };

  const getBoxShadow = () => {
    if (error) return '0 0 0 3px rgba(239, 68, 68, 0.1)';
    if (isFocused || isOpen) return '0 0 0 3px rgba(30, 86, 160, 0.1)';
    return 'none';
  };

  return (
    <div className="flex flex-col w-full" ref={containerRef}>
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled || loading}
          className={`flex items-center gap-3 rounded-xl bg-white w-full transition-all duration-200 ${
            disabled || loading
              ? 'opacity-60 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
          style={{
            border: `1px solid ${getBorderColor()}`,
            boxShadow: getBoxShadow(),
          }}
        >
          {/* Icono izquierdo */}
          {icon && (
            <div className="pl-4 flex items-center justify-center">
              <i
                className={`${icon} text-xl transition-colors duration-200`}
                style={{
                  color: isFocused || isOpen ? '#1E56A0' : '#97A3B1',
                }}
              ></i>
            </div>
          )}

          {/* Display Text */}
          <div
            className={`flex-1 h-14 flex items-center text-base font-normal text-left ${
              icon ? '' : 'pl-4'
            } pr-12`}
            style={{
              color: value ? '#111317' : '#97A3B1',
            }}
          >
            {loading ? 'Cargando...' : displayText}
          </div>

          {/* Icono de flecha */}
          <div className="absolute right-4 pointer-events-none">
            <i
              className={`ri-arrow-down-s-line text-xl transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              style={{ color: '#97A3B1' }}
            ></i>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && !loading && (
          <div
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-[#dcdfe5] overflow-hidden"
            style={{
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-[#97A3B1] text-sm">
                No hay opciones disponibles
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => handleOptionClick(e, option.value)}
                  className={`w-full px-4 py-3 text-left text-base transition-colors duration-200 hover:bg-[#D6E4F0] ${
                    option.value === value
                      ? 'bg-[#D6E4F0] text-[#1E56A0] font-medium'
                      : 'text-[#111317]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-2 flex items-center gap-2">
          <i className="ri-error-warning-line text-sm text-red-600"></i>
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}
    </div>
  );
}
