import { useState } from 'react';

export interface DetailItem {
  label: string;
  value: string | number | null;
  type?: 'text' | 'id' | 'status' | 'location' | 'time';
  maxLength?: number; // Para truncar texto largo
  copyable?: boolean; // Si se puede copiar (útil para IDs)
}

interface R2MDetailDisplayProps {
  items: DetailItem[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function R2MDetailDisplay({
  items,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
}: R2MDetailDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(label);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const formatValue = (item: DetailItem): string => {
    if (item.value === null || item.value === undefined) {
      return 'N/A';
    }

    const valueStr = String(item.value);

    // Si tiene maxLength definido y el valor es más largo, truncar
    if (item.maxLength && valueStr.length > item.maxLength) {
      return valueStr.substring(0, item.maxLength) + '...';
    }

    return valueStr;
  };

  const shouldShowCopyButton = (item: DetailItem): boolean => {
    if (!item.copyable) return false;
    const valueStr = String(item.value || '');
    return item.maxLength ? valueStr.length > item.maxLength : false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#646f87] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[20%_1fr] gap-x-6">
      {items.map((item, index) => (
        <div
          key={index}
          className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dcdfe5] py-5"
        >
          <p className="text-[#646f87] text-sm font-normal leading-normal">
            {item.label}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[#111317] text-sm font-normal leading-normal flex-1">
              {formatValue(item)}
            </p>
            {shouldShowCopyButton(item) && (
              <button
                onClick={() => handleCopy(String(item.value), item.label)}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-[#f0f2f4] transition-colors group relative"
                title="Copiar valor completo"
              >
                {copiedId === item.label ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#646f87] group-hover:text-[#111317]"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
