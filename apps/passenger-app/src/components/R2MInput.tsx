import { useState } from 'react';
import {
  RiMailLine,
  RiMailFill,
  RiLockPasswordLine,
  RiLockPasswordFill,
  RiEyeLine,
  RiEyeFill,
  RiEyeOffLine,
  RiEyeOffFill,
} from 'react-icons/ri';
import './R2MInput.css';

interface R2MInputProps {
  readonly type: 'email' | 'password' | 'text';
  readonly placeholder: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly required?: boolean;
}

const iconMap = {
  email: { line: RiMailLine, fill: RiMailFill },
  password: { line: RiLockPasswordLine, fill: RiLockPasswordFill },
  text: { line: RiMailLine, fill: RiMailFill }, // Default, puede ser extendido
};

export default function R2MInput({
  type,
  placeholder,
  value,
  onValueChange,
  required = false,
}: R2MInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEyeHovered, setIsEyeHovered] = useState(false);

  // Determinar el tipo de icono a mostrar
  let iconType: 'email' | 'password' | 'text' = 'text';
  if (type === 'password') {
    iconType = 'password';
  } else if (type === 'email') {
    iconType = 'email';
  }

  const IconLine = iconMap[iconType].line;
  const IconFill = iconMap[iconType].fill;

  // Tipo de input a renderizar
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div
      className={`r2m-input-container ${isFocused ? 'focused' : ''}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${isFocused ? 'rgba(var(--color-secondary-rgb), 0.5)' : 'rgba(var(--color-surface-rgb), 0.5)'}`,
        boxShadow: isFocused
          ? '0 0 0 3px rgba(var(--color-secondary-rgb), 0.1)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="r2m-input-icon">
        <IconLine
          className={`icon-line ${isFocused ? 'icon-hide' : 'icon-show'}`}
          size={20}
          style={{ color: 'var(--color-secondary)' }}
        />
        <IconFill
          className={`icon-fill ${isFocused ? 'icon-show' : 'icon-hide'}`}
          size={20}
          style={{ color: 'var(--color-secondary)' }}
        />
      </div>

      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        className="r2m-input-field"
      />

      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          onMouseEnter={() => setIsEyeHovered(true)}
          onMouseLeave={() => setIsEyeHovered(false)}
          className="r2m-input-action"
        >
          <div className="r2m-input-eye-icon">
            {showPassword ? (
              <>
                <RiEyeOffLine
                  className={`icon-line ${isEyeHovered ? 'icon-hide' : 'icon-show'}`}
                  size={20}
                  style={{ color: 'var(--color-secondary)' }}
                />
                <RiEyeOffFill
                  className={`icon-fill ${isEyeHovered ? 'icon-show' : 'icon-hide'}`}
                  size={20}
                  style={{ color: 'var(--color-secondary)' }}
                />
              </>
            ) : (
              <>
                <RiEyeLine
                  className={`icon-line ${isEyeHovered ? 'icon-hide' : 'icon-show'}`}
                  size={20}
                  style={{ color: 'var(--color-secondary)' }}
                />
                <RiEyeFill
                  className={`icon-fill ${isEyeHovered ? 'icon-show' : 'icon-hide'}`}
                  size={20}
                  style={{ color: 'var(--color-secondary)' }}
                />
              </>
            )}
          </div>
        </button>
      )}
    </div>
  );
}
