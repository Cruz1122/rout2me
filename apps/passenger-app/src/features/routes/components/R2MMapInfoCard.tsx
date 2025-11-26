import { useEffect, useState, useRef, useCallback } from 'react';
import {
  RiParkingFill,
  RiBusFill,
  RiTimeLine,
  RiCloseLine,
  RiFlagFill,
  RiPlayFill,
} from 'react-icons/ri';
import type { SearchItem } from '../../../shared/types/search';
import type { Stop } from '../services/routeService';
import type { Bus } from '../services/busService';

export type MarkerSelection =
  | { type: 'search'; data: SearchItem }
  | { type: 'stop'; data: Stop }
  | { type: 'bus'; data: Bus }
  | {
      type: 'endpoint';
      data: {
        type: 'start' | 'end';
        coordinates: [number, number];
        routeName?: string;
      };
    };

interface R2MMapInfoCardProps {
  readonly selectedItem?: SearchItem | null;
  readonly selectedMarker?: MarkerSelection | null;
  readonly onClose: () => void;
}

export default function R2MMapInfoCard({
  selectedItem,
  selectedMarker,
  onClose,
}: R2MMapInfoCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const wasVisibleRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Determinar qué mostrar: prioridad a selectedMarker sobre selectedItem
  const displayData =
    selectedMarker ||
    (selectedItem ? { type: 'search' as const, data: selectedItem } : null);

  useEffect(() => {
    if (displayData) {
      const isFirstAppearance = !wasVisibleRef.current;
      setIsVisible(true);
      setIsClosing(false);
      setDragX(0);
      setIsDragging(false);

      // Fade de entrada solo cuando aparece por primera vez
      if (isFirstAppearance) {
        setOpacity(0);
        // Pequeño delay para que el fade se vea
        setTimeout(() => {
          setOpacity(1);
        }, 10);
      } else {
        // Si ya estaba visible, mantener opacidad en 1
        setOpacity(1);
      }

      wasVisibleRef.current = true;
    } else {
      setIsVisible(false);
      setIsClosing(false);
      setOpacity(0);
      wasVisibleRef.current = false;
    }
  }, [displayData]);

  // Handler para cerrar
  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Usar requestAnimationFrame para asegurar que el estado se actualice antes de cambiar opacity
    requestAnimationFrame(() => {
      setOpacity(0); // Iniciar fade de salida
      // Esperar a que termine la animación fade antes de ocultar y llamar onClose
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        onClose();
      }, 200); // Duración del fade
    });
  }, [onClose]);

  // Handler para clic fuera del componente
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    // Agregar listener con delay para evitar cerrar inmediatamente al abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, handleClose]);

  useEffect(() => {
    if (isVisible && !isClosing) {
      const timer = setTimeout(() => {
        handleClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isClosing, handleClose]);

  // Cleanup cuando el componente se desmonta o displayData cambia a null
  useEffect(() => {
    if (!displayData) {
      setDragX(0);
      setIsDragging(false);
    }
  }, [displayData]);

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

    // Si se arrastra más de 80px, cerrar el modal con animación
    if (Math.abs(dragX) > 80) {
      setDragX(0);
      handleClose();
    } else {
      // Volver a la posición original
      setDragX(0);
    }
  };

  if (!displayData || !isVisible) return null;

  const formatFare = (fare?: number) => {
    if (!fare) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(fare);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'var(--color-success)';
      case 'nearby':
        return 'var(--color-warning)';
      case 'offline':
        return 'var(--color-terciary)';
      default:
        return 'var(--color-text)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'nearby':
        return 'Cerca';
      case 'offline':
        return 'Desconectado';
      default:
        return status;
    }
  };

  const getIcon = () => {
    if (
      displayData.type === 'stop' ||
      (displayData.type === 'search' && displayData.data.type === 'stop')
    ) {
      return (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
            color: 'rgb(var(--color-primary-rgb))',
          }}
        >
          <RiParkingFill size={20} />
        </div>
      );
    } else if (displayData.type === 'bus') {
      return (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
            color: 'rgb(var(--color-secondary-rgb))',
          }}
        >
          <RiBusFill size={20} />
        </div>
      );
    } else if (displayData.type === 'endpoint') {
      return (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
            color: 'rgb(var(--color-secondary-rgb))',
          }}
        >
          {displayData.data.type === 'start' ? (
            <RiPlayFill size={20} />
          ) : (
            <RiFlagFill size={20} />
          )}
        </div>
      );
    } else {
      // SearchItem route
      return (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
            color: 'rgb(var(--color-secondary-rgb))',
          }}
        >
          <RiBusFill size={20} />
        </div>
      );
    }
  };

  const getTitle = () => {
    if (displayData.type === 'stop') {
      return displayData.data.name;
    } else if (displayData.type === 'bus') {
      return `Bus ${displayData.data.routeNumber}`;
    } else if (displayData.type === 'endpoint') {
      return displayData.data.type === 'start'
        ? 'Punto de inicio'
        : 'Punto de destino';
    } else {
      return displayData.data.name;
    }
  };

  const getSubtitle = () => {
    if (displayData.type === 'stop') {
      return 'Parada';
    } else if (displayData.type === 'bus') {
      return displayData.data.routeName;
    } else if (displayData.type === 'endpoint') {
      return displayData.data.routeName || 'Ruta';
    } else {
      return displayData.data.type === 'stop' ? 'Paradero' : 'Ruta';
    }
  };

  const getCode = () => {
    if (displayData.type === 'stop') {
      return displayData.data.id.slice(0, 8);
    } else if (displayData.type === 'bus') {
      return displayData.data.plate;
    } else if (displayData.type === 'endpoint') {
      return '';
    } else {
      return displayData.data.code;
    }
  };

  return (
    <div
      className="fixed bottom-20 left-1/2 z-40"
      style={{ transform: 'translateX(-50%)' }}
      ref={cardRef}
    >
      <div
        className="bg-card rounded-2xl p-4 backdrop-blur-lg w-80 mx-auto overflow-hidden"
        style={{
          backgroundColor: 'var(--color-card)',
          border: `1px solid var(--color-border)`,
          boxShadow: 'var(--color-shadow)',
          transform: `translateX(${dragX}px) ${isDragging ? 'rotate(' + Math.max(-5, Math.min(5, dragX * 0.05)) + 'deg)' : ''}`,
          transition: (() => {
            if (isDragging) return 'none';
            if (isClosing) return 'opacity 0.2s ease-out';
            if (opacity === 0) return 'none';
            return 'opacity 0.2s ease-in, transform 0.2s ease-out';
          })(),
          opacity: (() => {
            if (isDragging) return Math.max(0.7, 1 - Math.abs(dragX) / 200);
            return opacity;
          })(),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            handleClose();
          }
        }}
        tabIndex={-1}
      >
        {/* Header con botón de cerrar */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getIcon()}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text truncate text-sm leading-tight m-0">
                {getTitle()}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {getCode() && (
                  <>
                    <span className="text-xs text-terciary font-mono">
                      {getCode()}
                    </span>
                    <span className="text-xs text-border">•</span>
                  </>
                )}
                <span className="text-xs text-terciary capitalize">
                  {getSubtitle()}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--color-terciary)' }}
            aria-label="Cerrar"
          >
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Información adicional según el tipo */}
        {displayData.type === 'search' &&
          displayData.data.type === 'route' &&
          'fare' in displayData.data &&
          displayData.data.fare && (
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
                  color: 'rgb(var(--color-secondary-rgb))',
                }}
              >
                {formatFare(displayData.data.fare)}
              </span>
            </div>
          )}

        {displayData.type === 'bus' && (
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-terciary">Estado:</span>
              <span
                className="font-medium"
                style={{ color: getStatusColor(displayData.data.status) }}
              >
                {getStatusLabel(displayData.data.status)}
              </span>
            </div>
            {displayData.data.location && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-terciary">Ocupación:</span>
                <span className="text-text">
                  {displayData.data.currentCapacity}/
                  {displayData.data.maxCapacity}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Auto-close indicator */}
        <div
          className="flex items-center gap-2 pt-2 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <RiTimeLine size={12} style={{ color: 'var(--color-terciary)' }} />
          <span className="text-xs text-terciary flex-1">
            Se cerrará automáticamente
          </span>
          <div
            className="w-12 h-0.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            <div
              className="h-full rounded-full animate-shrink-progress"
              style={{
                animationDuration: '5s',
                backgroundColor: 'var(--color-primary)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
