import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { isNativePlatform } from '../../../shared/utils/platform';
import { useIonToast } from '@ionic/react';

const EXIT_WARNING_TIMEOUT = 2000; // 2 segundos para presionar de nuevo

// Rutas principales donde no se puede navegar más atrás
const MAIN_ROUTES = ['/inicio', '/welcome', '/location-permission'];

/**
 * Hook para manejar el botón de atrás del hardware en Android
 * - Intenta navegar hacia atrás en el historial
 * - Si no hay historial, muestra un mensaje "Presiona otra vez para salir"
 * - Si el usuario presiona de nuevo dentro del tiempo límite, cierra la app
 */
export function useBackButton() {
  const location = useLocation();
  const [presentToast] = useIonToast();
  const lastBackPressRef = useRef<number | null>(null);

  useEffect(() => {
    // Solo activar en plataformas nativas (móvil)
    if (!isNativePlatform()) {
      return;
    }

    let listenerPromise: Promise<{
      remove: () => Promise<void>;
    }> | null = null;

    const handleBackButton = async () => {
      // Verificar si estamos en una ruta principal (donde normalmente no hay historial)
      const isMainRoute = MAIN_ROUTES.includes(location.pathname);
      const hasHistory = window.history.length > 1;

      // Si no estamos en una ruta principal y hay historial, intentar navegar atrás
      if (!isMainRoute && hasHistory) {
        try {
          // Intentar navegar usando el router de Ionic
          window.history.back();
        } catch (error) {
          console.error('Error navegando hacia atrás:', error);
        }
        return;
      }

      // Si estamos en una ruta principal o no hay historial, mostrar mensaje de salida
      const now = Date.now();

      if (
        lastBackPressRef.current &&
        now - lastBackPressRef.current < EXIT_WARNING_TIMEOUT
      ) {
        // El usuario presionó de nuevo dentro del tiempo límite, cerrar la app
        await App.exitApp();
      } else {
        // Mostrar mensaje de advertencia
        lastBackPressRef.current = now;

        await presentToast({
          message: 'Presiona otra vez para salir',
          duration: EXIT_WARNING_TIMEOUT,
          position: 'bottom',
          color: 'medium',
          cssClass: 'back-button-toast',
        });
      }
    };

    // Escuchar el evento del botón de atrás
    listenerPromise = App.addListener('backButton', handleBackButton);

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      if (listenerPromise) {
        listenerPromise.then((listener) => {
          listener.remove();
        });
      }
    };
  }, [location.pathname, presentToast]);
}
