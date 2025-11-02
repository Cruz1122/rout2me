import { colorClasses } from '../styles/colors';

export interface R2MButtonProps {
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'surface'
    | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly icon?: string; // Icono de Remix Icon (opcional)
  readonly iconPosition?: 'left' | 'right';
  readonly type?: 'button' | 'submit' | 'reset';
  readonly className?: string;
}

export default function R2MButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
}: R2MButtonProps) {
  // Variantes de color con animaciones
  const variantStyles = {
    primary: `${colorClasses.bgPrimary} ${colorClasses.hoverPrimary} text-white shadow-sm hover:shadow-md active:scale-[0.98]`,
    secondary: `${colorClasses.bgSecondary} ${colorClasses.hoverSecondary} text-white shadow-sm hover:shadow-md active:scale-[0.98]`,
    success:
      'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
    warning:
      'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
    surface: `${colorClasses.bgSurface} ${colorClasses.hoverSurface} ${colorClasses.textPrimary} shadow-sm hover:shadow-md active:scale-[0.98]`,
    ghost: `bg-transparent hover:bg-gray-100 ${colorClasses.textPrimary} active:scale-[0.98]`,
  };

  // Tamaños
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  // Estado deshabilitado o cargando
  const disabledStyles =
    disabled || loading
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : 'cursor-pointer';

  // Ancho completo
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-semibold
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-[#1E56A0] focus:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyles}
        ${widthStyle}
        ${className}
        group
      `}
    >
      {/* Spinner de carga */}
      {loading && (
        <div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          style={{
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}

      {/* Icono izquierdo */}
      {icon && iconPosition === 'left' && !loading && (
        <i
          className={`${icon} transition-transform duration-200 group-hover:scale-110`}
        />
      )}

      {/* Contenido */}
      <span className="truncate">{children}</span>

      {/* Icono derecho */}
      {icon && iconPosition === 'right' && !loading && (
        <i
          className={`${icon} transition-transform duration-200 group-hover:scale-110`}
        />
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
