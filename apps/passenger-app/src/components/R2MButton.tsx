import { RiLoaderLine } from 'react-icons/ri';
import './R2MButton.css';

interface R2MButtonProps {
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  readonly size?: 'small' | 'medium' | 'large';
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
}

export default function R2MButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
}: R2MButtonProps) {
  const getClassNames = () => {
    const classes = [
      'r2m-button',
      `r2m-button-${variant}`,
      `r2m-button-${size}`,
    ];
    if (fullWidth) classes.push('r2m-button-full');
    if (loading || disabled) classes.push('r2m-button-disabled');
    return classes.join(' ');
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={getClassNames()}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <RiLoaderLine className="animate-spin" size={20} />
        </div>
      ) : (
        children
      )}
    </button>
  );
}
