import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { isNativePlatform } from '../../../shared/utils/platform';
import { useIonToast, useIonRouter } from '@ionic/react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useSmartNavigation } from './useSmartNavigation';

const EXIT_WARNING_TIMEOUT = 2000; // 2 segundos para presionar de nuevo

/**
 * Hook para manejar el botón de atrás del hardware en Android/iOS
 * - Usa navegación inteligente basada en relaciones padre-hijo
 * - Valida rutas destino para evitar retrocesos inválidos
 * - Evita retrocesos a rutas de autenticación cuando el usuario está autenticado
 * - Muestra mensaje "Presiona otra vez para salir" en rutas principales
 * - Cierra la app si el usuario presiona de nuevo dentro del tiempo límite
 */
export function useBackButton() {
  const location = useLocation();
  const router = useIonRouter();
  const { isAuthenticated } = useAuth();
  const [presentToast] = useIonToast();
  const lastBackPressRef = useRef<number | null>(null);
  const smartNavigation = useSmartNavigation(isAuthenticated);

  useEffect(() => {
    // Solo activar en plataformas nativas (móvil)
    if (!isNativePlatform()) {
      return;
    }

    let listenerPromise: Promise<{
      remove: () => Promise<void>;
    }> | null = null;

    const handleBackButton = async () => {
      const currentPath = location.pathname;

      // Determinar la ruta válida a la que retroceder usando navegación inteligente
      const validBackRoute = smartNavigation.getValidBackRoute(currentPath);

      // Si hay una ruta válida de retroceso, navegar a ella
      if (validBackRoute) {
        try {
          router.push(validBackRoute, 'back');
        } catch (error) {
          console.error('Error navegando hacia atrás:', error);
          // En caso de error, intentar con window.history como fallback
          try {
            window.history.back();
          } catch (fallbackError) {
            console.error('Error en fallback de navegación:', fallbackError);
          }
        }
        return;
      }

      // Si estamos en una ruta principal o no hay ruta válida de retroceso,
      // mostrar mensaje de salida
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
  }, [
    location.pathname,
    presentToast,
    router,
    smartNavigation,
    isAuthenticated,
  ]);
}
