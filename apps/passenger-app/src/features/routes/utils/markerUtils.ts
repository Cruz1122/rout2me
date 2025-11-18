interface StopMarkerOptions {
  color?: string;
  opacity?: number;
  highlight?: boolean;
}

export function createStopMarkerElement(
  options: StopMarkerOptions = {},
): HTMLElement {
  const { color = '#FF6B35', opacity = 1, highlight = false } = options;

  const wrapper = document.createElement('div');
  const marker = document.createElement('div');

  marker.style.cssText = `
    background: ${color};
    border: ${highlight ? '4px' : '3px'} solid #ffffff;
    border-radius: 50%;
    width: ${highlight ? '30px' : '24px'};
    height: ${highlight ? '30px' : '24px'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${highlight ? '14px' : '12px'};
    color: white;
    font-weight: bold;
    box-shadow: ${
      highlight
        ? '0 4px 12px rgba(16, 185, 129, 0.35)'
        : '0 2px 8px rgba(0, 0, 0, 0.3)'
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
