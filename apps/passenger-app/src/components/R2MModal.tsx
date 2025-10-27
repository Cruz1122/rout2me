import { type ReactNode } from 'react';
import { RiCloseLine } from 'react-icons/ri';

interface R2MModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: ReactNode;
  readonly iconColor?: string;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
}

export default function R2MModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconColor = 'var(--color-secondary)',
  children,
  actions,
}: R2MModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Overlay para capturar clicks y reducir brillo del fondo */}
      <button
        className="absolute inset-0 backdrop-blur-[1px] z-40 bg-transparent border-none p-0 w-full h-full"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        aria-label="Cerrar modal"
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md mx-4 mb-4 bg-white rounded-t-2xl shadow-2xl animate-slide-up z-50"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
                style={{ backgroundColor: iconColor }}
              >
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">{children}</div>

        {/* Actions */}
        {actions && <div className="p-6 pt-0">{actions}</div>}
      </div>
    </div>
  );
}
