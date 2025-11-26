import { useState } from 'react';
import { RiUser5Fill } from 'react-icons/ri';

interface R2MAvatarProps {
  readonly avatarUrl?: string | null;
  readonly userName?: string;
  readonly size?: number;
  readonly iconSize?: number;
  readonly badge?: React.ReactNode;
}

/**
 * Componente de avatar con fallback a ícono por defecto
 */
export default function R2MAvatar({
  avatarUrl,
  userName = 'Usuario',
  size = 64,
  iconSize = 32,
  badge,
}: R2MAvatarProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        className="rounded-full flex items-center justify-center overflow-hidden w-full h-full"
        style={{
          backgroundColor:
            avatarUrl && !hasError ? 'transparent' : 'var(--color-surface)',
        }}
      >
        {avatarUrl && !hasError ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <RiUser5Fill
            size={iconSize}
            style={{ color: 'var(--color-terciary)' }}
          />
        )}
      </div>
      {badge && (
        <div
          className="absolute"
          style={{
            bottom: 0,
            right: 0,
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
}
