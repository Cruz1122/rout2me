interface R2MCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function R2MCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  error,
  helperText,
  size = 'md',
}: R2MCheckboxProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        className={`flex items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div
            className={`${sizeClasses[size]} rounded border-2 transition-all duration-200 flex items-center justify-center ${
              checked
                ? 'bg-[#1980e6] border-[#1980e6]'
                : error
                  ? 'bg-white border-red-500'
                  : 'bg-white border-[#dcdfe5]'
            } ${
              !disabled &&
              'peer-focus:ring-2 peer-focus:ring-[#1980e6] peer-focus:ring-offset-2'
            } ${disabled ? '' : 'hover:border-[#1980e6]'}`}
          >
            {checked && (
              <svg
                className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
        <span
          className={`${textSizeClasses[size]} font-medium ${error ? 'text-red-600' : 'text-[#111317]'} select-none`}
        >
          {label}
        </span>
      </label>
      {helperText && !error && (
        <p className="text-xs text-[#646f87] ml-8">{helperText}</p>
      )}
      {error && <p className="text-xs text-red-500 ml-8">{error}</p>}
    </div>
  );
}
