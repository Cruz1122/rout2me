import { type ReactNode } from 'react';
import { IoRefresh } from 'react-icons/io5';

interface R2MPageHeaderProps {
  readonly title: string;
  readonly leftIcon?: ReactNode;
  readonly onLeftIconClick?: () => void;
  readonly onRefresh?: () => void;
  readonly showRefreshButton?: boolean;
}

/**
 * Componente reutilizable para headers de página
 * Mantiene consistencia visual entre todas las páginas
 */
export default function R2MPageHeader({
  title,
  leftIcon,
  onLeftIconClick,
  onRefresh,
  showRefreshButton = true,
}: R2MPageHeaderProps) {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Si no se proporciona una función de recarga, recargar la página completa
      window.location.reload();
    }
  };

  return (
    <div
      className="sticky top-0 z-50 backdrop-blur-lg"
      style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-card)',
      }}
    >
      <div className="flex items-center h-14 relative">
        {leftIcon && onLeftIconClick && (
          <button
            onClick={onLeftIconClick}
            className="absolute left-4 p-2 transition-colors hover:opacity-70"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Volver atrás"
          >
            {leftIcon}
          </button>
        )}
        <h1
          className="text-xl font-bold text-center flex-1"
          style={{ color: 'var(--color-primary)' }}
        >
          {title}
        </h1>
        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            className="absolute right-4 p-2 transition-colors hover:opacity-70"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-primary)',
            }}
            aria-label="Recargar página"
          >
            <IoRefresh size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
