import { useDriverLocationTracking } from '../hooks/useDriverLocationTracking';

/**
 * Componente que maneja el tracking de ubicación del conductor en background
 * Se monta globalmente en la app para que funcione independientemente de la vista actual
 */
export default function DriverLocationTracker() {
  // El hook se encarga de todo el tracking automático
  // Solo se activa cuando hay un bus activo
  useDriverLocationTracking({
    intervalSeconds: 10, // Enviar ubicación cada 10 segundos
    onError: (error) => {
      // Log del error pero no interrumpir la experiencia del usuario
      console.error('[DriverLocationTracker] Error en tracking:', error);
    },
  });

  // Este componente no renderiza nada, solo maneja el tracking en background
  return null;
}
