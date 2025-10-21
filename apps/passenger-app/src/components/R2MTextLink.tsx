import './R2MTextLink.css';

interface R2MTextLinkProps {
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly variant?: 'primary' | 'secondary' | 'terciary';
  readonly size?: 'small' | 'medium';
}

export default function R2MTextLink({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
}: R2MTextLinkProps) {
  const getColorByVariant = () => {
    switch (variant) {
      case 'primary':
        return 'var(--color-primary)';
      case 'secondary':
        return 'var(--color-secondary)';
      case 'terciary':
        return 'var(--color-terciary)';
      default:
        return 'var(--color-primary)';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return '14px';
      case 'medium':
        return '16px';
      default:
        return '16px';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="r2m-text-link"
      style={{
        color: getColorByVariant(),
        fontSize: getFontSize(),
      }}
    >
      {children}
    </button>
  );
}
