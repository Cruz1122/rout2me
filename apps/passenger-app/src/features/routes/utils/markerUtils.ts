interface StopMarkerOptions {
  color?: string;
  opacity?: number;
  highlight?: boolean;
}

interface EndpointMarkerOptions {
  type: 'start' | 'end';
  color?: string;
  opacity?: number;
}

// Helper para obtener colores de rutas desde CSS variables
const getRouteColor = (variable: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
};

// Helper para obtener colores RGB desde CSS variables
const getRouteColorRGB = (variable: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
};

/**
 * Crea un marcador personalizado para puntos de origen/destino
 * Más pequeño y diferenciado del marcador del usuario
 */
export function createEndpointMarkerElement(
  options: EndpointMarkerOptions,
): HTMLElement {
  const { color, opacity = 1 } = options;
  const finalColor =
    color || getRouteColor('--color-route-endpoint', '#1E56A0');
  const borderColor = getRouteColor('--color-route-outline', '#ffffff');
  const shadowColor = getRouteColor(
    '--color-shadow',
    '0 2px 8px rgba(0, 0, 0, 0.3)',
  );

  const wrapper = document.createElement('div');
  const marker = document.createElement('div');

  // Marcador más pequeño (18px) con estilo diferenciado del usuario
  // El usuario tiene 20px con animación de pulso, estos son más pequeños y sin pulso
  marker.style.cssText = `
    background: ${finalColor};
    border: 2.5px solid ${borderColor};
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: block;
    box-shadow: ${shadowColor};
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: ${opacity};
    position: relative;
    z-index: 999;
  `;

  marker.addEventListener('mouseenter', () => {
    marker.style.transform = 'scale(1.2)';
    marker.style.boxShadow =
      '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 0 2px ' + finalColor;
  });

  marker.addEventListener('mouseleave', () => {
    marker.style.transform = 'scale(1)';
    marker.style.boxShadow = shadowColor + ', inset 0 0 0 2px ' + finalColor;
  });

  wrapper.appendChild(marker);

  return wrapper;
}

/**
 * Crea un marcador personalizado para paradas
 */
export function createStopMarkerElement(
  options: StopMarkerOptions = {},
): HTMLElement {
  // Obtener colores del tema actual
  const stopColor =
    options.color || getRouteColor('--color-route-stop', '#FF6B35');
  const borderColor = getRouteColor('--color-route-outline', '#ffffff');
  const successColorRGB = getRouteColorRGB(
    '--color-success-rgb',
    '22, 163, 74',
  );
  const shadowColor = getRouteColor(
    '--color-shadow',
    '0 2px 8px rgba(0, 0, 0, 0.3)',
  );
  const { opacity = 1, highlight = false } = options;

  const wrapper = document.createElement('div');
  const marker = document.createElement('div');

  marker.style.cssText = `
    background: ${stopColor};
    border: ${highlight ? '4px' : '3px'} solid ${borderColor};
    border-radius: 50%;
    width: ${highlight ? '30px' : '24px'};
    height: ${highlight ? '30px' : '24px'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${highlight ? '14px' : '12px'};
    color: ${borderColor};
    font-weight: bold;
    box-shadow: ${
      highlight ? `0 4px 12px rgba(${successColorRGB}, 0.35)` : shadowColor
    };
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: ${opacity};
    position: relative;
  `;

  const label = document.createElement('strong');
  label.textContent = 'P';
  label.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: 0;
    line-height: 1;
    transform: translateY(1px);
  `;
  marker.appendChild(label);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes stopPulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.85; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  if (highlight) {
    marker.style.animation = 'stopPulse 2s infinite';
  }

  marker.addEventListener('mouseenter', () => {
    marker.style.transform = 'scale(1.2)';
  });

  marker.addEventListener('mouseleave', () => {
    marker.style.transform = 'scale(1)';
  });

  wrapper.appendChild(style);
  wrapper.appendChild(marker);

  return wrapper;
}
