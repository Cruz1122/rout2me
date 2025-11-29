import { RiWifiOffLine } from 'react-icons/ri';
import { useTheme } from '../../contexts/ThemeContext';
import R2MButton from './R2MButton';

interface ConnectionErrorProps {
  readonly error: string | { message: string };
  readonly onRetry?: () => void;
  readonly title?: string;
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
 * Componente reutilizable para mostrar errores de conexión en el contenido de la página
 */
export default function ConnectionError({
  error,
  onRetry,
  title = 'Error de conexión',
}: ConnectionErrorProps) {
  const { theme } = useTheme();

  // Extraer el mensaje del error
  const errorMessage =
    typeof error === 'string' ? error : error.message || 'Error desconocido';

  // Normalizar el mensaje a user-friendly
  const normalizedMessage = normalizeErrorMessage(errorMessage);

  return (
    <div
      className="flex items-center justify-center w-full py-12 px-4"
      style={{ minHeight: '100%' }}
    >
      <div
        className="w-full max-w-md p-6 rounded-xl"
        style={{
          backgroundColor: 'var(--color-card)',
          border: `1px solid ${theme === 'dark' ? 'var(--color-border)' : 'rgba(var(--color-error-rgb), 0.2)'}`,
        }}
      >
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor:
                theme === 'dark' ? 'var(--color-surface)' : '#FFFFFF',
              border: `2.5px solid var(--color-error)`,
            }}
          >
            <RiWifiOffLine size={32} style={{ color: 'var(--color-error)' }} />
          </div>
        </div>

        {/* Título */}
        <h3
          className="text-center text-lg font-semibold mb-2"
          style={{ color: 'var(--color-text)' }}
        >
          {title}
        </h3>

        {/* Mensaje de error */}
        <p
          className="text-center text-sm mb-6"
          style={{ color: 'var(--color-terciary)' }}
        >
          {normalizedMessage}
        </p>

        {/* Botón de reintentar */}
        {onRetry && (
          <div className="flex justify-center">
            <R2MButton onClick={onRetry} variant="primary" size="medium">
              Reintentar
            </R2MButton>
          </div>
        )}
      </div>
    </div>
  );
}
