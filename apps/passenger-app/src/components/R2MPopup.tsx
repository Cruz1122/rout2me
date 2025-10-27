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
          color: '#1F2937',
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
            color: '#6B7280',
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
            color: '#374151',
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

// Función helper para crear el HTML del popup
export const createPopupHTML = (props: R2MPopupProps): string => {
  const { title, subtitle, items } = props;

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
      <div style="font-weight: 600; color: #1F2937; margin-bottom: ${subtitle ? '4px' : '8px'}; font-size: 16px;">
        ${title}
      </div>
      ${
        subtitle
          ? `
        <div style="font-size: 14px; color: #6B7280; margin-bottom: 8px;">
          ${subtitle}
        </div>
      `
          : ''
      }
      ${items
        .map(
          (item, index) => `
        <div style="font-size: 14px; color: #374151; margin-bottom: ${index < items.length - 1 ? '4px' : '0'};">
          <strong>${item.label}:</strong> 
          <span style="color: ${item.color || 'inherit'}; font-weight: ${item.color ? '600' : 'normal'};">
            ${typeof item.value === 'string' ? item.value : ''}
          </span>
        </div>
      `,
        )
        .join('')}
    </div>
  `;
};
