import React, { memo } from 'react';
import {
  RiAddLine,
  RiSubtractLine,
  RiCompassLine,
  RiDeleteBinLine,
  RiFocus3Line,
} from 'react-icons/ri';

interface MapControlsProps {
  mapBearing: number;
  isDraggingCompass: boolean;
  isClearingRoutes: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetBearing: () => void;
  onLocationRequest: () => void;
  onClearRoutes: () => void;
  onCompassMouseDown: (e: React.MouseEvent) => void;
  onCompassTouchStart: (e: React.TouchEvent) => void;
}

const MapControls = memo<MapControlsProps>(function MapControls({
  mapBearing,
  isDraggingCompass,
  isClearingRoutes,
  onZoomIn,
  onZoomOut,
  onResetBearing,
  onLocationRequest,
  onClearRoutes,
  onCompassMouseDown,
  onCompassTouchStart,
}) {
  return (
    <div className="fixed top-20 right-4 z-40 flex flex-col gap-2" slot="fixed">
      <button
        onClick={onZoomIn}
        className="w-12 h-12 rounded-full backdrop-blur-lg 
                   flex items-center justify-center transition-all duration-200
                   hover:scale-105 active:scale-95 shadow-lg
                   opacity-40 hover:opacity-100"
        style={{
          backgroundColor: 'rgba(var(--color-card-rgb), 0.95)',
          border: `1px solid var(--color-border)`,
          borderRadius: '50%',
          boxShadow: 'var(--color-shadow)',
        }}
        aria-label="Acercar"
      >
        <RiAddLine size={20} style={{ color: 'var(--color-text)' }} />
      </button>

      <button
        onClick={onZoomOut}
        className="w-12 h-12 rounded-full backdrop-blur-lg 
                   flex items-center justify-center transition-all duration-200
                   hover:scale-105 active:scale-95 shadow-lg
                   opacity-40 hover:opacity-100"
        style={{
          backgroundColor: 'rgba(var(--color-card-rgb), 0.95)',
          border: `1px solid var(--color-border)`,
          borderRadius: '50%',
          boxShadow: 'var(--color-shadow)',
        }}
        aria-label="Alejar"
      >
        <RiSubtractLine size={20} style={{ color: 'var(--color-text)' }} />
      </button>

      <button
        onClick={onResetBearing}
        onMouseDown={onCompassMouseDown}
        onTouchStart={onCompassTouchStart}
        className={`w-12 h-12 rounded-full backdrop-blur-lg 
                   flex items-center justify-center transition-all duration-200
                   hover:scale-105 active:scale-95 shadow-lg select-none
                   ${isDraggingCompass ? 'cursor-grabbing scale-105 opacity-100' : 'cursor-pointer opacity-40 hover:opacity-100'}`}
        style={{
          backgroundColor: isDraggingCompass
            ? 'rgba(var(--color-secondary-rgb), 0.95)'
            : 'rgba(var(--color-card-rgb), 0.95)',
          border: `1px solid ${isDraggingCompass ? 'rgba(var(--color-secondary-rgb), 0.5)' : 'var(--color-border)'}`,
          borderRadius: '50%',
          boxShadow: 'var(--color-shadow)',
        }}
        aria-label="Arrastrar para rotar - Click para resetear"
      >
        <RiCompassLine
          size={20}
          style={{
            color: isDraggingCompass
              ? 'var(--color-on-secondary)'
              : 'var(--color-text)',
            transform: `rotate(${mapBearing}deg)`,
            transition: isDraggingCompass ? 'none' : 'transform 0.2s ease',
          }}
        />
      </button>

      <button
        onClick={onLocationRequest}
        className="w-12 h-12 rounded-full backdrop-blur-lg 
                   flex items-center justify-center transition-all duration-200
                   hover:scale-105 active:scale-95 shadow-lg
                   opacity-40 hover:opacity-100"
        style={{
          backgroundColor: 'rgba(var(--color-card-rgb), 0.95)',
          border: `1px solid var(--color-border)`,
          borderRadius: '50%',
          boxShadow: 'var(--color-shadow)',
        }}
        aria-label="Mi ubicación"
      >
        <RiFocus3Line size={20} style={{ color: 'var(--color-text)' }} />
      </button>

      <button
        onClick={onClearRoutes}
        disabled={isClearingRoutes}
        className={`w-12 h-12 rounded-full backdrop-blur-lg 
                   flex items-center justify-center transition-all duration-300 ease-out
                   hover:scale-105 active:scale-95 shadow-lg
                   ${isClearingRoutes ? 'scale-95 opacity-100' : 'cursor-pointer opacity-40 hover:opacity-100'}
                   disabled:cursor-not-allowed`}
        style={{
          backgroundColor: isClearingRoutes
            ? 'rgba(var(--color-error-rgb), 0.95)'
            : 'rgba(var(--color-card-rgb), 0.95)',
          border: `1px solid ${isClearingRoutes ? 'rgba(var(--color-error-rgb), 0.5)' : 'var(--color-border)'}`,
          borderRadius: '50%',
          boxShadow: isClearingRoutes
            ? '0 10px 25px -5px rgba(var(--color-error-rgb), 0.4), 0 4px 6px -2px rgba(var(--color-error-rgb), 0.2)'
            : 'var(--color-shadow)',
          transform: isClearingRoutes ? 'scale(0.95)' : 'scale(1)',
        }}
        aria-label="Limpiar rutas"
      >
        <RiDeleteBinLine
          size={20}
          style={{
            color: isClearingRoutes ? '#FFFFFF' : 'var(--color-text)',
            transform: isClearingRoutes ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}
        />
      </button>
    </div>
  );
});

export default MapControls;
