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
  readonly style?: React.CSSProperties;
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
  style,
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

  const getSpinnerColor = () => {
    if (variant === 'primary' || variant === 'secondary')
      return 'var(--color-on-primary)';
    if (variant === 'outline' || variant === 'ghost')
      return 'var(--color-primary)';
    return 'var(--color-primary)';
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={getClassNames()}
      style={style}
    >
      {loading ? (
        <div
          className="border-2 border-current border-t-transparent rounded-full animate-spin"
          style={{
            width: '20px',
            height: '20px',
            borderColor: getSpinnerColor(),
            borderTopColor: 'transparent',
          }}
        />
      ) : (
        children
      )}
    </button>
  );
}
