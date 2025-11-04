import { useState } from 'react';

interface R2MInputProps {
  readonly type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  readonly placeholder: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly required?: boolean;
  readonly error?: string;
  readonly icon?: string; // Remix Icon class
  readonly disabled?: boolean;
  readonly maxLength?: number;
  readonly onBlur?: () => void;
}

export default function R2MInput({
  type = 'text',
  placeholder,
  value,
  onValueChange,
  required = false,
  error,
  icon,
  disabled = false,
  maxLength,
  onBlur,
}: R2MInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const getBorderColor = () => {
    if (error) return '#ef4444';
    if (isFocused) return '#1E56A0';
    return '#dcdfe5';
  };

  const getBoxShadow = () => {
    if (error) return '0 0 0 3px rgba(239, 68, 68, 0.1)';
    if (isFocused) return '0 0 0 3px rgba(30, 86, 160, 0.1)';
    return 'none';
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative">
        <div
          className={`flex items-center gap-3 rounded-xl bg-white transition-all duration-200 ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
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
                  color: isFocused ? '#1E56A0' : '#97A3B1',
                }}
              ></i>
            </div>
          )}

          {/* Input */}
          <input
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            className={`flex-1 h-14 bg-transparent text-[#111317] placeholder:text-[#97A3B1] text-base font-normal focus:outline-none ${
              icon ? '' : 'pl-4'
            } ${type === 'password' ? 'pr-2' : 'pr-4'}`}
          />

          {/* Botón de mostrar/ocultar contraseña */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pr-4 flex items-center justify-center transition-colors duration-200 hover:opacity-80"
              tabIndex={-1}
            >
              <i
                className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-xl`}
                style={{ color: '#97A3B1' }}
              ></i>
            </button>
          )}
        </div>
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
