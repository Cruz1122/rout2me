import { useCallback, useRef } from 'react';

/**
 * Hook para throttling de funciones
 * Ejecuta la función como máximo una vez por intervalo de tiempo
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        // Ejecutar inmediatamente si ha pasado suficiente tiempo
        lastRunRef.current = now;
        callback(...args);
      } else {
        // Programar ejecución para después del delay restante
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay],
  ) as T;

  return throttledCallback;
}
