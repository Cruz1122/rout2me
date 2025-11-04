import { useRef, useEffect } from 'react';
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Observar cambios en aria-hidden del ancestro
    const observer = new MutationObserver(() => {
      const page = button.closest('.ion-page');
      if (page?.getAttribute('aria-hidden') === 'true') {
        // Si la página se oculta y este botón tiene el focus, quitarlo
        if (document.activeElement === button) {
          button.blur();
        }
      }
    });

    // Observar cambios en el ancestro .ion-page
    const page = button.closest('.ion-page');
    if (page) {
      observer.observe(page, {
        attributes: true,
        attributeFilter: ['aria-hidden'],
      });
    }

    return () => {
      observer.disconnect();
      // Asegurar que el botón pierde el focus al desmontarse
      if (document.activeElement === button) {
        button.blur();
      }
    };
  }, []);

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
      ref={buttonRef}
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
