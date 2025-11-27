import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  RiParkingLine,
  RiParkingFill,
  RiBusLine,
  RiBusFill,
  RiTimeLine,
} from 'react-icons/ri';
import type {
  R2MResultsListProps,
  SearchItem,
} from '../../../shared/types/search';
import { recentSearchesStorage } from '../services/recentSearchService';

export default function R2MResultsList({
  items,
  onSelect,
  isVisible,
}: Readonly<R2MResultsListProps>) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Obtener combinaciones recientes (tipo-id) cuando cambian los items
  const recentSearchKeys = useMemo(() => {
    const entries = recentSearchesStorage.getRecentSearches();
    return new Set(entries.map((entry) => `${entry.type}-${entry.id}`));
  }, []);

  const isRecentItem = (item: SearchItem): boolean =>
    recentSearchKeys.has(`${item.type}-${item.id}`);

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible || items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < items.length) {
            onSelect(items[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setActiveIndex(-1);
          break;
      }
    },
    [isVisible, items, activeIndex, onSelect],
  );

  // Add keyboard listener
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  if (!isVisible || items.length === 0) {
    return null;
  }

  const getItemIcon = (item: SearchItem, isActive: boolean) => {
    if (item.type === 'stop') {
      return (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
          style={{
            backgroundColor: isActive
              ? 'rgba(var(--color-primary-rgb), 0.1)'
              : 'rgba(var(--color-primary-rgb), 0.05)',
            color: 'rgb(var(--color-primary-rgb))',
          }}
        >
          {isActive ? <RiParkingFill size={16} /> : <RiParkingLine size={16} />}
        </div>
      );
    } else {
      return (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
          style={{
            backgroundColor: isActive
              ? 'rgba(var(--color-secondary-rgb), 0.1)'
              : 'rgba(var(--color-secondary-rgb), 0.05)',
            color: 'rgb(var(--color-secondary-rgb))',
          }}
        >
          {isActive ? <RiBusFill size={16} /> : <RiBusLine size={16} />}
        </div>
      );
    }
  };

  const formatFare = (fare?: number) => {
    if (!fare) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(fare);
  };

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 mt-2 max-w-2xl mx-auto rounded-xl 
                 shadow-lg z-50 max-h-52 overflow-y-auto r2m-results-list animate-slide-down"
      style={{
        backgroundColor: 'var(--color-card)',
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--color-shadow)',
      }}
      role="listbox"
      aria-label="Resultados de búsqueda"
      aria-activedescendant={
        activeIndex >= 0 ? `search-result-${items[activeIndex]?.id}` : undefined
      }
      tabIndex={0}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          id={`search-result-${item.id}`}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          onMouseDown={(e) => {
            // Prevenir que el input pierda el foco al hacer clic
            e.preventDefault();
            onSelect(item);
          }}
          onTouchEnd={(e) => {
            // Para dispositivos táctiles, prevenir el comportamiento por defecto
            e.preventDefault();
            onSelect(item);
          }}
          onMouseEnter={(e) => {
            setActiveIndex(index);
            if (index !== activeIndex) {
              e.currentTarget.style.backgroundColor =
                'rgba(var(--color-primary-rgb), 0.05)';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(item);
            }
          }}
          className={`
            r2m-result-item flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-200
            r2m-touch-target
            ${index === activeIndex ? 'active' : ''}
            ${index === 0 ? 'rounded-t-xl' : ''}
            ${index === items.length - 1 ? 'rounded-b-xl' : ''}
          `}
          style={{
            backgroundColor:
              index === activeIndex
                ? 'rgba(var(--color-primary-rgb), 0.1)'
                : 'transparent',
            borderBottom:
              index < items.length - 1
                ? '1px solid var(--color-border)'
                : 'none',
          }}
          onMouseLeave={(e) => {
            if (index !== activeIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          role="option"
          aria-selected={index === activeIndex}
          aria-label={`${item.type === 'stop' ? 'Paradero' : 'Ruta'} ${item.name}, código ${item.code}`}
          tabIndex={index === activeIndex ? 0 : -1}
        >
          {getItemIcon(item, index === activeIndex)}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className="font-semibold text-base truncate leading-tight"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {item.name}
                  </p>
                  {isRecentItem(item) && (
                    <div
                      className="flex-shrink-0 flex items-center"
                      title={
                        item.type === 'stop'
                          ? 'Paradero reciente'
                          : 'Ruta reciente'
                      }
                      aria-label={
                        item.type === 'stop'
                          ? 'Paradero reciente'
                          : 'Ruta reciente'
                      }
                    >
                      <RiTimeLine
                        size={16}
                        style={{ color: 'var(--color-primary)' }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-sm font-mono"
                    style={{ color: 'var(--color-terciary)' }}
                  >
                    {item.code}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--color-border)' }}
                  >
                    •
                  </span>
                  <span
                    className="text-sm capitalize"
                    style={{ color: 'var(--color-terciary)' }}
                  >
                    {item.type === 'stop' ? 'Paradero' : 'Ruta'}
                  </span>
                </div>
              </div>
              {item.type === 'route' && 'fare' in item && item.fare && (
                <span
                  className="text-sm font-semibold ml-3 flex-shrink-0"
                  style={{ color: 'rgb(var(--color-secondary-rgb))' }}
                >
                  {formatFare(item.fare)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
