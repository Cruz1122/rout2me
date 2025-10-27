import { useState, useEffect } from 'react';
import { RiErrorWarningLine, RiCloseLine } from 'react-icons/ri';

interface ErrorNotificationProps {
  readonly error: string | null;
  readonly onClose: () => void;
  readonly autoClose?: boolean;
  readonly duration?: number;
}

/**
 * Componente para mostrar notificaciones de error integradas en la vista
 */
export default function ErrorNotification({
  error,
  onClose,
  autoClose = true,
  duration = 5000,
}: ErrorNotificationProps) {
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

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 transform transition-all duration-300 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-full opacity-0 scale-95'
      }`}
    >
      <div
        className={`flex items-start p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          backgroundColor: '#fef2f2',
          borderLeftColor: '#ef4444',
          border: '1px solid #fecaca',
        }}
      >
        {/* Icono de error */}
        <div
          className={`flex-shrink-0 mr-3 transition-all duration-300 delay-100 ${
            isVisible ? 'scale-100 rotate-0' : 'scale-75 rotate-12'
          }`}
        >
          <RiErrorWarningLine size={20} style={{ color: '#ef4444' }} />
        </div>

        {/* Contenido del error */}
        <div
          className={`flex-1 min-w-0 transition-all duration-300 delay-150 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
          }`}
        >
          <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
            Error
          </p>
          <p className="text-sm mt-1" style={{ color: '#991b1b' }}>
            {error}
          </p>
        </div>

        {/* Botón de cerrar */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className={`flex-shrink-0 ml-3 p-1 rounded-full hover:bg-red-100 transition-all duration-200 delay-200 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          } hover:scale-110 active:scale-95`}
          style={{ color: '#dc2626' }}
        >
          <RiCloseLine size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook para manejar errores en componentes
 */
export function useErrorNotification() {
  const [error, setError] = useState<string | null>(null);

  const showError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const handleError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    showError(message);
  };

  return {
    error,
    showError,
    clearError,
    handleError,
  };
}
