import { useState } from 'react';

interface R2MActionIconButtonProps {
  readonly icon: string; // Clase de icono de Remix Icon (ej: "ri-eye-line")
  readonly label: string; // Texto del tooltip
  readonly onClick: (e: React.MouseEvent) => void;
  readonly variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
  readonly disabled?: boolean;
}

export default function R2MActionIconButton({
  icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}: R2MActionIconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const variantStyles = {
    primary: 'hover:bg-[#D6E4F0] text-[#163172]',
    success: 'hover:bg-green-50 text-green-600',
    danger: 'hover:bg-red-50 text-red-600',
    warning: 'hover:bg-orange-50 text-orange-600',
    info: 'hover:bg-blue-50 text-blue-600',
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
          disabled
            ? 'opacity-40 cursor-not-allowed text-gray-400'
            : variantStyles[variant]
        }`}
        title={label}
      >
        <i className={`${icon} text-lg`}></i>
      </button>

      {/* Tooltip elegante - siempre renderizado para evitar cambio de layout */}
      <div
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none z-50 transition-opacity duration-200 ${
          showTooltip && !disabled ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {label}
        {/* Flecha del tooltip */}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #111827',
          }}
        ></div>
      </div>
    </div>
  );
}
