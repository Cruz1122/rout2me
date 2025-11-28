import React, { memo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

interface MapContainerProps {
  mapRef: React.RefObject<HTMLDivElement | null>;
}

const MapContainer = memo<MapContainerProps>(function MapContainer({ mapRef }) {
  const { theme } = useTheme();

  return (
    <div
      ref={mapRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1,
        touchAction: 'pan-x pan-y',
        backgroundColor: theme === 'dark' ? '#131517' : 'var(--color-bg)',
      }}
    />
  );
});

export default MapContainer;
