import { useState, useEffect } from 'react';
import { RiUser5Fill } from 'react-icons/ri';
import {
  getAvatarFromCache,
  saveAvatarToCache,
  cleanOldAvatarCache,
} from '../services/avatarCacheService';

interface R2MAvatarProps {
  avatarUrl?: string | null;
  userName?: string;
  size?: number;
  iconSize?: number;
}

/**
 * Componente de avatar con caché automático y fallback a ícono por defecto
 */
export default function R2MAvatar({
  avatarUrl,
  userName = 'Usuario',
  size = 64,
  iconSize = 32,
}: R2MAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Limpiar caché antiguo al montar el componente
    cleanOldAvatarCache();
  }, []);

  useEffect(() => {
    if (!avatarUrl || hasError) {
      setImageSrc(null);
      return;
    }

    // Verificar si la imagen está en caché
    const cachedImage = getAvatarFromCache(avatarUrl);
    if (cachedImage) {
      setImageSrc(cachedImage);
      return;
    }

    // Si no está en caché, cargar la imagen
    const loadImage = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(avatarUrl);

        if (!response.ok) {
          throw new Error('Failed to load image');
        }

        const blob = await response.blob();

        // Guardar en caché
        await saveAvatarToCache(avatarUrl, blob);

        // Convertir a base64 para mostrar
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageSrc(reader.result as string);
          setIsLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch {
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [avatarUrl, hasError]);

  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor:
          imageSrc && !hasError ? 'transparent' : 'var(--color-surface)',
      }}
    >
      {imageSrc && !hasError && !isLoading ? (
        <img
          src={imageSrc}
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
  );
}
