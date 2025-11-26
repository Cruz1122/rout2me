import type { ReactNode } from 'react';
import { RiArrowRightSLine } from 'react-icons/ri';

interface R2MProfileButtonProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly onClick: () => void;
  readonly variant?: 'default' | 'danger';
  readonly disabled?: boolean;
}

/**
 * Componente reutilizable para botones de perfil
 * Usa !important (prefijo !) para sobrescribir estilos globales
 */
export default function R2MProfileButton({
  icon,
  title,
  description,
  onClick,
  variant = 'default',
  disabled = false,
}: R2MProfileButtonProps) {
  const isDanger = variant === 'danger';
  const iconColor = disabled
    ? 'var(--color-terciary)'
    : isDanger
      ? 'var(--color-error)'
      : 'var(--color-primary)';
  const textColor = disabled
    ? 'var(--color-terciary)'
    : isDanger
      ? 'var(--color-error)'
      : 'var(--color-text)';
  const hoverBg =
    disabled || isDanger
      ? ''
      : 'hover:!bg-[rgba(var(--color-surface-rgb),0.6)]';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`!w-full !flex !items-center !gap-3 !p-2 !rounded-xl !transition-colors !border-none !bg-transparent !text-left ${hoverBg} ${
        disabled ? '!cursor-not-allowed !opacity-60' : '!cursor-pointer'
      }`}
      style={{
        color: textColor,
      }}
    >
      <div
        className="!flex-shrink-0 !w-10 !h-10 !rounded-full !flex !items-center !justify-center"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div style={{ color: iconColor }}>{icon}</div>
      </div>
      <div className="!flex-1 !text-left">
        <p className="!text-sm !font-medium !m-0" style={{ color: textColor }}>
          {title}
        </p>
        {description && (
          <p
            className="!text-xs !m-0 !mt-0.5"
            style={{ color: 'var(--color-terciary)' }}
          >
            {description}
          </p>
        )}
      </div>
      <RiArrowRightSLine size={18} style={{ color: iconColor }} />
    </button>
  );
}
