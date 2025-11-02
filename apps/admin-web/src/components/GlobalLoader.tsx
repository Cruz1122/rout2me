import { useEffect, useState } from 'react';
import R2MLoader from './R2MLoader';
import './GlobalLoader.css';

interface GlobalLoaderProps {
  isExiting?: boolean;
}

export default function GlobalLoader({
  isExiting = false,
}: Readonly<GlobalLoaderProps>) {
  const [shouldRender, setShouldRender] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isExiting) {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isExiting]);

  if (!shouldRender) return null;

  return (
    <div
      className={`global-loader ${isVisible ? 'global-loader--visible' : ''}`}
    >
      <R2MLoader />
    </div>
  );
}
