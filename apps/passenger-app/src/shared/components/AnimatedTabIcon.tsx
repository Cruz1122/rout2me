import { useState, useEffect } from 'react';
import {
  RiHomeSmileLine,
  RiHomeSmileFill,
  RiRouteLine,
  RiRouteFill,
  RiBus2Line,
  RiBus2Fill,
  RiNotification4Line,
  RiNotification4Fill,
  RiUser5Line,
  RiUser5Fill,
} from 'react-icons/ri';
import './AnimatedTabIcon.css';

interface AnimatedTabIconProps {
  iconName: 'home' | 'route' | 'bus' | 'notification' | 'user';
  isActive?: boolean;
}

const iconMap = {
  home: { line: RiHomeSmileLine, fill: RiHomeSmileFill },
  route: { line: RiRouteLine, fill: RiRouteFill },
  bus: { line: RiBus2Line, fill: RiBus2Fill },
  notification: { line: RiNotification4Line, fill: RiNotification4Fill },
  user: { line: RiUser5Line, fill: RiUser5Fill },
};

export default function AnimatedTabIcon({
  iconName,
  isActive = false,
}: Readonly<AnimatedTabIconProps>) {
  const [isIonicActive, setIsIonicActive] = useState(false);

  const IconLine = iconMap[iconName].line;
  const IconFill = iconMap[iconName].fill;

  useEffect(() => {
    // Verificar si el botón padre tiene la clase tab-selected
    const checkIonicActive = () => {
      const tabButton = document.querySelector(
        `ion-tab-button[tab="${iconName === 'home' ? 'inicio' : iconName === 'route' ? 'rutas' : iconName === 'bus' ? 'en-vivo' : iconName === 'notification' ? 'alertas' : 'perfil'}"]`,
      );
      if (tabButton) {
        setIsIonicActive(tabButton.classList.contains('tab-selected'));
      }
    };

    checkIonicActive();

    // Observar cambios en las clases
    const observer = new MutationObserver(checkIonicActive);
    const tabButton = document.querySelector(
      `ion-tab-button[tab="${iconName === 'home' ? 'inicio' : iconName === 'route' ? 'rutas' : iconName === 'bus' ? 'en-vivo' : iconName === 'notification' ? 'alertas' : 'perfil'}"]`,
    );
    if (tabButton) {
      observer.observe(tabButton, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    return () => observer.disconnect();
  }, [iconName]);

  const showFill = isActive || isIonicActive;

  return (
    <div className="animated-tab-icon">
      <div
        className="relative flex items-center justify-center"
        style={{ width: '20px', height: '20px' }}
      >
        <IconLine
          size={20}
          className={`absolute top-0 left-0 transition-all duration-200 ease-out ${
            showFill ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
          }`}
          style={{ color: 'var(--color-terciary)' }}
        />
        <IconFill
          size={20}
          className={`absolute top-0 left-0 transition-all duration-200 ease-out ${
            showFill ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
          style={{ color: 'var(--color-primary)' }}
        />
      </div>
    </div>
  );
}
