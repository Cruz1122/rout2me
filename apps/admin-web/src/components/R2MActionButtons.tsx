export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

interface R2MActionButtonsProps {
  readonly actions: ActionButton[];
  readonly orientation?: 'vertical' | 'horizontal';
  readonly className?: string;
}

export default function R2MActionButtons({
  actions,
  orientation = 'vertical',
  className = '',
}: R2MActionButtonsProps) {
  const getButtonStyles = (
    variant: ActionButton['variant'] = 'primary',
    disabled = false,
  ) => {
    const baseStyles =
      'flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] transition-colors';

    if (disabled) {
      return `${baseStyles} opacity-50 cursor-not-allowed bg-gray-300 text-gray-500`;
    }

    const variantStyles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer',
      secondary:
        'bg-[#f0f2f4] hover:bg-[#e8edf3] text-[#111317] cursor-pointer',
      danger: 'bg-red-600 hover:bg-red-700 text-white cursor-pointer',
      warning: 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer',
      success: 'bg-green-600 hover:bg-green-700 text-white cursor-pointer',
    };

    return `${baseStyles} ${variantStyles[variant]}`;
  };

  const containerStyles =
    orientation === 'vertical'
      ? 'flex flex-col gap-2'
      : 'flex flex-row flex-wrap gap-2';

  return (
    <div className={`${containerStyles} ${className}`}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={getButtonStyles(
            action.variant,
            action.disabled || action.loading,
          )}
        >
          {action.loading && (
            <span className="animate-spin border-2 border-white/20 border-t-white w-4 h-4 rounded-full mr-2" />
          )}
          {action.icon && !action.loading && (
            <span className="mr-2">{action.icon}</span>
          )}
          <span className="truncate">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
