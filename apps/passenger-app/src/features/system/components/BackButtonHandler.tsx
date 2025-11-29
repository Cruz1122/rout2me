import { useBackButton } from '../hooks/useBackButton';

/**
 * Componente wrapper para manejar el botón de atrás del hardware en móviles.
 *
 * Características:
 * - Navegación inteligente basada en relaciones padre-hijo entre rutas
 * - Valida rutas destino para evitar retrocesos inválidos
 * - Evita retrocesos a rutas de autenticación cuando el usuario está autenticado
 * - Muestra mensaje "Presiona otra vez para salir" en rutas principales
 * - Cierra la app si el usuario presiona de nuevo dentro del tiempo límite
 *
 * Debe estar montado dentro del contexto del router (IonReactRouter) y del contexto
 * de autenticación para que funcione correctamente.
 */
export default function BackButtonHandler() {
  useBackButton();
  return null;
}
