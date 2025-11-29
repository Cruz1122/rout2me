import { useState, useEffect } from 'react';
import { RiErrorWarningLine, RiCloseLine } from 'react-icons/ri';
import { useTheme } from '../../contexts/ThemeContext';

interface R2MErrorToastProps {
  readonly error: string | null;
  readonly onClose: () => void;
  readonly autoClose?: boolean;
  readonly duration?: number;
}

/**
 * Normaliza mensajes de error técnicos a mensajes user-friendly
 */
function normalizeErrorMessage(error: string): string {
  const errorLower = error.toLowerCase();

  if (
    errorLower.includes('failed to fetch') ||
    errorLower.includes('networkerror') ||
    errorLower.includes('network error')
  ) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }

  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return 'La solicitud tardó demasiado. Intenta nuevamente.';
  }

  if (errorLower.includes('connection') || errorLower.includes('conexión')) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }

  // Si el mensaje ya está en español o es user-friendly, devolverlo tal cual
  return error;
}

/**
 * Componente mejorado para mostrar notificaciones de error tipo toast
 * Rediseñado con mejor estética, glassmorphism y mejor jerarquía visual
 */
export default function R2MErrorToast({
  error,
  onClose,
  autoClose = true,
  duration = 5000,
}: R2MErrorToastProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      // Pequeño delay para asegurar que el DOM esté listo
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 10);

      if (autoClose) {
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Delay para completar animación de salida
        }, duration);

        return () => {
          clearTimeout(showTimer);
          clearTimeout(hideTimer);
        };
      }

      return () => clearTimeout(showTimer);
    } else {
      setIsVisible(false);
    }
  }, [error, autoClose, duration, onClose]);

  if (!error) {
    return null;
  }

  // Normalizar el mensaje
  const normalizedMessage = normalizeErrorMessage(error);

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 transform transition-all duration-300 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-full opacity-0 scale-95'
      }`}
    >
      <div
        className={`flex items-start p-4 rounded-xl transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          backgroundColor: 'var(--color-card)',
          border: `1px solid var(--color-border)`,
          borderLeft: `4px solid var(--color-error)`,
          boxShadow: 'var(--color-shadow)',
        }}
      >
        {/* Icono de error en círculo */}
        <div
          className={`flex-shrink-0 mr-3 transition-all duration-300 delay-100 ${
            isVisible ? 'scale-100 rotate-0' : 'scale-75 rotate-12'
          }`}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor:
                theme === 'dark' ? 'var(--color-surface)' : '#FFFFFF',
              border: `2.5px solid var(--color-error)`,
            }}
          >
            <RiErrorWarningLine
              size={20}
              style={{ color: 'var(--color-error)' }}
            />
          </div>
        </div>

        {/* Contenido del error */}
        <div
          className={`flex-1 min-w-0 transition-all duration-300 delay-150 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
          }`}
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: 'var(--color-error)' }}
          >
            Error
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text)' }}
          >
            {normalizedMessage}
          </p>
        </div>

        {/* Botón de cerrar */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className={`flex-shrink-0 ml-3 p-1 rounded-full transition-all duration-200 delay-200 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
          style={{
            color: 'var(--color-terciary)',
          }}
          onMouseEnter={(e) => {
            const isDark =
              document.documentElement.getAttribute('data-theme') === 'dark';
            e.currentTarget.style.backgroundColor = isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Cerrar notificación"
        >
          <RiCloseLine size={18} />
        </button>
      </div>
    </div>
  );
}
