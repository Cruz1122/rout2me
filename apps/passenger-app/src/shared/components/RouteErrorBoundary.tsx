import { Component, type ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import ConnectionError from './ConnectionError';

interface RouteErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface RouteErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

/**
 * Error Boundary para capturar errores de renderizado y carga de módulos
 * Muestra un mensaje útil cuando falla la carga debido a falta de conexión
 */
export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidMount() {
    // Escuchar errores globales de carga de módulos (promesas rechazadas)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorMessage =
        reason?.message || (typeof reason === 'string' ? reason : '') || '';
      const errorName = reason?.name || '';

      // Detectar errores de carga de módulos dinámicos
      if (
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Failed to fetch') ||
        errorName === 'ChunkLoadError' ||
        errorMessage.includes('Loading chunk')
      ) {
        event.preventDefault();
        this.setState({
          hasError: true,
          error:
            reason instanceof Error
              ? reason
              : new Error(
                  'No se pudo cargar la página. Verifica tu conexión a internet.',
                ),
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    this.cleanup = () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    };
  }

  componentWillUnmount() {
    if (this.cleanup) {
      this.cleanup();
    }
  }

  private cleanup?: () => void;

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    // Recargar la página como último recurso
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Verificar si es un error de carga de módulo
      const isModuleLoadError =
        this.state.error?.message?.includes(
          'Failed to fetch dynamically imported module',
        ) ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <IonPage>
          <IonContent
            className="flex items-center justify-center"
            style={{ '--background': 'var(--color-bg)' }}
          >
            <ConnectionError
              error={
                isModuleLoadError
                  ? 'No se pudo cargar la página. Verifica tu conexión a internet e intenta nuevamente.'
                  : this.state.error?.message || 'Error al cargar la página'
              }
              onRetry={this.handleRetry}
              title="Error al cargar la página"
            />
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}
