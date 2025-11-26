import React from 'react';

export interface R2MPopupProps {
  title: string;
  subtitle?: string;
  items: Array<{
    label: string;
    value: string | React.ReactNode;
    color?: string;
  }>;
}

export const R2MPopup: React.FC<R2MPopupProps> = ({
  title,
  subtitle,
  items,
}) => {
  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minWidth: '200px',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: subtitle ? '4px' : '8px',
          fontSize: '16px',
        }}
      >
        {title}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: '14px',
            color: 'var(--color-terciary)',
            marginBottom: '8px',
          }}
        >
          {subtitle}
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          style={{
            fontSize: '14px',
            color: 'var(--color-text)',
            marginBottom: index < items.length - 1 ? '4px' : '0',
          }}
        >
          <strong>{item.label}:</strong>{' '}
          <span
            style={{
              color: item.color || 'inherit',
              fontWeight: item.color ? 600 : 'normal',
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};
