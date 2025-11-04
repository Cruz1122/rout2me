import type { ReactNode } from 'react';

interface R2MModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  readonly closeOnClickOutside?: boolean;
}

export default function R2MModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  closeOnClickOutside = true,
}: R2MModalProps) {
  if (!isOpen) return null;

  const maxWidthValues = {
    sm: '448px', // max-w-md
    md: '512px', // max-w-lg
    lg: '576px', // max-w-xl
    xl: '672px', // max-w-2xl
    '2xl': '896px', // max-w-4xl
  };

  const handleBackdropClick = () => {
    if (closeOnClickOutside) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/40 transition-opacity cursor-default"
        onClick={handleBackdropClick}
        aria-label="Cerrar modal"
        tabIndex={-1}
      />

      {/* Modal */}
      <div
        className="relative z-50 w-full max-w-[96%] rounded-xl bg-white p-6 shadow-xl"
        style={{
          fontFamily: 'Inter, sans-serif',
          maxWidth: `min(${maxWidthValues[maxWidth]}, 96vw)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[#111317] text-[22px] font-bold leading-tight tracking-[-0.015em]">
            {title}
          </h1>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f2f4] text-[#646f87] transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t border-[#dcdfe5]">{footer}</div>
        )}
      </div>
    </div>
  );
}
