import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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

type AnimationState = 'hidden' | 'exiting' | 'entering' | 'visible';

const ANIMATION_DURATION = 200; // ms

export default function R2MMapInfoCard({
  selectedItem,
  selectedMarker,
  onClose,
}: R2MMapInfoCardProps) {
  const [animationState, setAnimationState] =
    useState<AnimationState>('hidden');
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determinar qué mostrar: prioridad a selectedMarker sobre selectedItem
  const displayData = useMemo(() => {
    return (
      selectedMarker ||
      (selectedItem ? { type: 'search' as const, data: selectedItem } : null)
    );
  }, [selectedMarker, selectedItem]);

  // Crear displayKey único basado en el tipo y datos del popup
  const displayKey = useMemo(() => {
    if (!displayData) return null;

    if (displayData.type === 'stop') {
      return `stop-${displayData.data.id}`;
    } else if (displayData.type === 'bus') {
      return `bus-${displayData.data.plate}`;
    } else if (displayData.type === 'endpoint') {
      return `endpoint-${displayData.data.type}-${displayData.data.coordinates.join(',')}`;
    } else {
      // SearchItem
      return `search-${displayData.data.type}-${displayData.data.id}`;
    }
  }, [displayData]);

  const previousDisplayKeyRef = useRef<string | null>(null);

  // Handler para cerrar
  const handleClose = useCallback(() => {
    // Limpiar timers pendientes
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    // Usar función de actualización para obtener el estado actual
    setAnimationState((currentState) => {
      if (currentState === 'hidden' || currentState === 'exiting') {
        return currentState;
      }

      // Iniciar animación de salida
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setAnimationState('hidden');
        previousDisplayKeyRef.current = null;
        onClose();
      }, ANIMATION_DURATION);
      return 'exiting';
    });
  }, [onClose]);

  // Función auxiliar para iniciar animación de entrada
  const startEnterAnimation = useCallback((key: string) => {
    setAnimationState('entering');
    previousDisplayKeyRef.current = key;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setAnimationState('visible');
    }, ANIMATION_DURATION);
  }, []);

  // Función auxiliar para iniciar animación de salida
  const startExitAnimation = useCallback(() => {
    setAnimationState('exiting');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setAnimationState('hidden');
      previousDisplayKeyRef.current = null;
    }, ANIMATION_DURATION);
  }, []);

  // Función auxiliar para manejar cambio de contenido
  const handleContentChange = useCallback(
    (currentKey: string) => {
      // Usar función de actualización para obtener el estado actual
      setAnimationState((currentState) => {
        const needsExitAnimation =
          currentState === 'visible' ||
          currentState === 'entering' ||
          currentState === 'exiting';

        if (needsExitAnimation) {
          // Fade out primero, luego fade in
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            startEnterAnimation(currentKey);
          }, ANIMATION_DURATION);
          return 'exiting';
        } else {
          // Estado hidden, entrar directamente
          startEnterAnimation(currentKey);
          return currentState;
        }
      });
    },
    [startEnterAnimation],
  );

  // Manejar cambios de contenido y animaciones
  useEffect(() => {
    const previousKey = previousDisplayKeyRef.current;
    const currentKey = displayKey;

    // Si no hay contenido, cerrar
    if (!currentKey) {
      // Limpiar timers pendientes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Actualizar la referencia primero
      previousDisplayKeyRef.current = null;

      // Usar función de actualización para obtener el estado actual
      setAnimationState((currentState) => {
        const isCurrentlyVisible =
          currentState === 'visible' || currentState === 'entering';
        if (isCurrentlyVisible || currentState === 'exiting') {
          // Iniciar animación de salida
          const timeoutId = setTimeout(() => {
            setAnimationState('hidden');
          }, ANIMATION_DURATION);
          timeoutRef.current = timeoutId;
          return 'exiting';
        } else {
          return 'hidden';
        }
      });
      return;
    }

    // Si hay contenido y cambió la clave
    if (previousKey !== currentKey) {
      // Limpiar timers pendientes INMEDIATAMENTE
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Si está en proceso de cerrar (exiting), cancelar la animación de salida
      // y reiniciar inmediatamente con el nuevo contenido
      setAnimationState((currentState) => {
        if (currentState === 'exiting') {
          // Cancelar la animación de salida y entrar inmediatamente con el nuevo contenido
          // Actualizar la referencia antes de iniciar la animación
          previousDisplayKeyRef.current = currentKey;
          // Iniciar animación de entrada inmediatamente (sin esperar a que termine el exit)
          startEnterAnimation(currentKey);
          return 'entering';
        } else {
          // Actualizar la referencia antes de manejar el cambio
          previousDisplayKeyRef.current = currentKey;

          if (previousKey === null) {
            // Primera aparición: entrar directamente
            startEnterAnimation(currentKey);
            return currentState;
          } else {
            // Cambio de contenido: fade out → cambio → fade in
            handleContentChange(currentKey);
            return currentState;
          }
        }
      });
    }
    // Si la clave no cambió, no hacer nada (mantener estado actual)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    displayKey,
    startEnterAnimation,
    startExitAnimation,
    handleContentChange,
  ]);

  // Auto-close timer
  useEffect(() => {
    if (animationState === 'visible' && !isDragging) {
      autoCloseTimerRef.current = setTimeout(() => {
        handleClose();
      }, 4500);

      return () => {
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
          autoCloseTimerRef.current = null;
        }
      };
    }
  }, [animationState, isDragging, handleClose]);

  // Reset drag cuando cambia el contenido
  useEffect(() => {
    if (displayKey && previousDisplayKeyRef.current !== displayKey) {
      setDragX(0);
      setIsDragging(false);
    }
  }, [displayKey]);

  // Handler para clic fuera del componente
  useEffect(() => {
    if (animationState !== 'visible') return;

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
  }, [animationState, handleClose]);

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

  // Calcular opacidad basada en el estado de animación
  const getOpacity = () => {
    if (isDragging) {
      return Math.max(0.7, 1 - Math.abs(dragX) / 200);
    }
    switch (animationState) {
      case 'hidden':
        return 0;
      case 'exiting':
        return 0;
      case 'entering':
        return 1;
      case 'visible':
        return 1;
      default:
        return 0;
    }
  };

  // Calcular transición CSS
  const getTransition = () => {
    if (isDragging) return 'none';
    if (animationState === 'hidden') return 'none';
    return `opacity ${ANIMATION_DURATION}ms ease-in-out, transform 0.2s ease-out`;
  };

  if (!displayData || animationState === 'hidden') return null;

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
    const secondaryIconStyle = {
      backgroundColor: 'rgba(var(--color-secondary-rgb), 0.1)',
      color: 'rgb(var(--color-secondary-rgb))',
    };

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
    }

    // Bus, endpoint y SearchItem route comparten el mismo estilo
    let iconContent: React.ReactNode;
    if (displayData.type === 'endpoint') {
      iconContent =
        displayData.data.type === 'start' ? (
          <RiPlayFill size={20} />
        ) : (
          <RiFlagFill size={20} />
        );
    } else {
      iconContent = <RiBusFill size={20} />;
    }

    return (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={secondaryIconStyle}
      >
        {iconContent}
      </div>
    );
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
          transition: getTransition(),
          opacity: getOpacity(),
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
              key={displayKey} // Key única para reiniciar la animación cuando cambia el contenido
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
