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
}: AnimatedTabIconProps) {
  const [showFill, setShowFill] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      // Pequeño delay para la animación
      const timer = setTimeout(() => setShowFill(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowFill(false);
    }
  }, [isActive]);

  const IconLine = iconMap[iconName].line;
  const IconFill = iconMap[iconName].fill;

  return (
    <div className="animated-tab-icon">
      <IconLine
        className={`icon-line ${isActive ? 'icon-hide' : 'icon-show'}`}
        size={20}
      />
      <IconFill
        className={`icon-fill ${showFill ? 'icon-show' : 'icon-hide'}`}
        size={20}
      />
    </div>
  );
}
