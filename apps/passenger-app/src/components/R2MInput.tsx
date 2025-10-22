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
  RiPhoneLine,
  RiPhoneFill,
  RiIdCardLine,
  RiIdCardFill,
  RiPenNibLine,
  RiPenNibFill,
  RiHashtag,
} from 'react-icons/ri';
import './R2MInput.css';

interface R2MInputProps {
  readonly type:
    | 'email'
    | 'password'
    | 'text'
    | 'phone'
    | 'name'
    | 'company'
    | 'shortName';
  readonly placeholder: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly required?: boolean;
  readonly showOptional?: boolean;
}

const iconMap = {
  email: { line: RiMailLine, fill: RiMailFill },
  password: { line: RiLockPasswordLine, fill: RiLockPasswordFill },
  phone: { line: RiPhoneLine, fill: RiPhoneFill },
  name: { line: RiIdCardLine, fill: RiIdCardFill },
  company: { line: RiPenNibLine, fill: RiPenNibFill },
  shortName: { line: RiHashtag, fill: RiHashtag },
  text: { line: RiIdCardLine, fill: RiIdCardFill }, // Default
};

// Función auxiliar para obtener el tipo de icono
const getIconType = (inputType: string): keyof typeof iconMap => {
  const typeMap: Record<string, keyof typeof iconMap> = {
    password: 'password',
    email: 'email',
    phone: 'phone',
    name: 'name',
    company: 'company',
    shortName: 'shortName',
  };
  return typeMap[inputType] || 'text';
};

// Función auxiliar para obtener el tipo de input
const getInputType = (type: string, showPassword: boolean) => {
  if (type === 'password' && showPassword) return 'text';
  if (type === 'phone') return 'tel';
  return type;
};

// Componente para los indicadores de campo
const FieldIndicators = ({ showOptional }: { showOptional: boolean }) => {
  if (!showOptional) return null;

  return (
    <div className="r2m-input-indicators">
      <span className="r2m-input-optional">Opcional</span>
    </div>
  );
};

// Componente para el icono del input
const InputIcon = ({
  isFocused,
  IconLine,
  IconFill,
}: {
  isFocused: boolean;
  IconLine: React.ComponentType<{
    className?: string;
    size?: number;
    style?: React.CSSProperties;
  }>;
  IconFill: React.ComponentType<{
    className?: string;
    size?: number;
    style?: React.CSSProperties;
  }>;
}) => (
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
);

// Componente para el prefijo del teléfono
const PhonePrefix = () => (
  <div className="r2m-input-prefix">
    <span className="r2m-input-prefix-text">+57</span>
  </div>
);

// Componente para el botón de mostrar/ocultar contraseña
const PasswordToggle = ({
  showPassword,
  isEyeHovered,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}: {
  showPassword: boolean;
  isEyeHovered: boolean;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
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
);

export default function R2MInput({
  type,
  placeholder,
  value,
  onValueChange,
  required = false,
  showOptional = false,
}: R2MInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEyeHovered, setIsEyeHovered] = useState(false);

  const iconType = getIconType(type);
  const IconLine = iconMap[iconType].line;
  const IconFill = iconMap[iconType].fill;
  const inputType = getInputType(type, showPassword);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'phone') {
      // Solo pasar los números, sin +57
      const inputValue = e.target.value;
      onValueChange(inputValue);
    } else {
      onValueChange(e.target.value);
    }
  };

  const handlePasswordToggle = () => setShowPassword(!showPassword);
  const handleEyeMouseEnter = () => setIsEyeHovered(true);
  const handleEyeMouseLeave = () => setIsEyeHovered(false);

  return (
    <div className="r2m-input-wrapper">
      <FieldIndicators showOptional={showOptional} />

      <div
        className={`r2m-input-container ${isFocused ? 'focused' : ''} ${type === 'password' ? 'password-field' : ''}`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${isFocused ? 'rgba(var(--color-secondary-rgb), 0.5)' : 'rgba(var(--color-surface-rgb), 0.5)'}`,
          boxShadow: isFocused
            ? '0 0 0 3px rgba(var(--color-secondary-rgb), 0.1)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <InputIcon
          isFocused={isFocused}
          IconLine={IconLine}
          IconFill={IconFill}
        />

        {type === 'phone' && <PhonePrefix />}

        <input
          type={inputType}
          placeholder={type === 'phone' ? '300 123 4567' : placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className="r2m-input-field"
        />

        {type === 'password' && (
          <PasswordToggle
            showPassword={showPassword}
            isEyeHovered={isEyeHovered}
            onToggle={handlePasswordToggle}
            onMouseEnter={handleEyeMouseEnter}
            onMouseLeave={handleEyeMouseLeave}
          />
        )}
      </div>
    </div>
  );
}
