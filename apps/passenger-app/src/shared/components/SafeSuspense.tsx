import { Suspense, type ComponentType, type ReactNode } from 'react';
import { LazyExoticComponent } from 'react';
import GlobalLoader from '../../features/system/components/GlobalLoader';
import RouteErrorBoundary from './RouteErrorBoundary';

interface SafeSuspenseProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

/**
 * Wrapper de Suspense que incluye ErrorBoundary para manejar errores de carga
 * Especialmente útil para errores de carga de módulos dinámicos cuando no hay conexión
 */
export default function SafeSuspense({
  children,
  fallback = <GlobalLoader />,
}: SafeSuspenseProps) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={fallback}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}
