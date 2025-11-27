import { useBackButton } from '../hooks/useBackButton';

/**
 * Componente wrapper para manejar el botón de atrás del hardware.
 * Debe estar montado dentro del contexto del router para que useLocation funcione.
 */
export default function BackButtonHandler() {
  useBackButton();
  return null;
}
