import { useEffect, useState } from 'react';
import { RiMapPinFill, RiBusFill, RiTimeLine } from 'react-icons/ri';
import type { SearchItem } from '../types/search';

interface R2MMapInfoCardProps {
  readonly selectedItem: SearchItem | null;
  readonly onClose: () => void;
}

export default function R2MMapInfoCard({
  selectedItem,
  onClose,
}: R2MMapInfoCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  useEffect(() => {
    if (selectedItem) {
      setIsVisible(true);
      // Resetear el estado de drag para la nueva card
      setDragX(0);
      setIsDragging(false);
    } else {
      setIsVisible(false);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 30000); // Auto-hide after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Cleanup cuando el componente se desmonta o selectedItem cambia a null
  useEffect(() => {
    if (!selectedItem) {
      setDragX(0);
      setIsDragging(false);
    }
  }, [selectedItem]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setStartX(touch.clientX);
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;

    // Limitar el drag a un máximo de 150px en cada dirección
    const maxDrag = 150;
    const limitedDeltaX = Math.max(-maxDrag, Math.min(maxDrag, deltaX));

    setDragX(limitedDeltaX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;

    // Limitar el drag a un máximo de 150px en cada dirección
    const maxDrag = 150;
    const limitedDeltaX = Math.max(-maxDrag, Math.min(maxDrag, deltaX));

    setDragX(limitedDeltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Si se arrastra más de 80px, cerrar el modal
    if (Math.abs(dragX) > 80) {
      // Resetear completamente el estado antes de cerrar
      setDragX(0);
      setIsVisible(false);
      onClose();
    } else {
      // Volver a la posición original
      setDragX(0);
    }
  };

  if (!selectedItem || !isVisible) return null;

  const formatFare = (fare?: number) => {
    if (!fare) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(fare);
  };

  const getIcon = () => {
    if (selectedItem.type === 'stop') {
      return (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
            color: 'rgb(var(--color-primary-rgb))',
          }}
        >
          <RiMapPinFill size={24} />
        </div>
      );
    } else {
      return (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
            color: 'rgb(var(--color-secondary-rgb))',
          }}
        >
          <RiBusFill size={24} />
        </div>
      );
    }
  };

  return (
    <div
      className="fixed bottom-20 left-1/2 z-40"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div
        className="bg-white rounded-2xl p-4 backdrop-blur-lg w-80 mx-auto
                   transform transition-all duration-300 animate-slide-up cursor-grab active:cursor-grabbing"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: `1px solid rgba(var(--color-surface-rgb), 0.3)`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          transform: `translateX(${dragX}px) ${isDragging ? 'rotate(' + Math.max(-5, Math.min(5, dragX * 0.05)) + 'deg)' : ''}`,
          transition: isDragging
            ? 'none'
            : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: isDragging ? Math.max(0.7, 1 - Math.abs(dragX) / 200) : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Indicador de swipe */}
        <div className="flex justify-center mb-2">
          <div
            className="w-8 h-1 rounded-full"
            style={{ backgroundColor: 'rgba(var(--color-surface-rgb), 0.3)' }}
          />
        </div>

        <div className="flex items-center gap-3 flex-col">
          {getIcon()}

          <div className="flex-1 min-w-0 flex flex-col items-center">
            <p className="font-semibold text-gray-900 truncate text-base leading-tight m-0">
              {selectedItem.name}
            </p>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 font-mono">
                {selectedItem.code}
              </span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-400 capitalize">
                {selectedItem.type === 'stop' ? 'Paradero' : 'Ruta'}
              </span>
            </div>

            {/* Información adicional */}
            {selectedItem.type === 'route' &&
              'fare' in selectedItem &&
              selectedItem.fare && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
                      color: 'rgb(var(--color-secondary-rgb))',
                    }}
                  >
                    {formatFare(selectedItem.fare)}
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Auto-close indicator */}
        <div
          className="flex items-center gap-2 mt-3 pt-3 border-t"
          style={{ borderColor: 'rgba(var(--color-surface-rgb), 0.2)' }}
        >
          <RiTimeLine size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400 flex-1">
            Se cerrará automáticamente
          </span>
          <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full animate-shrink-progress"
              style={{
                animationDuration: '30s',
                backgroundColor: 'rgb(var(--color-primary-rgb))',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
