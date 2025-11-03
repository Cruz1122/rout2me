/**
 * Servicio de caché para avatares de usuario
 * Guarda las imágenes en localStorage por 7 días
 */

interface CacheData {
  data: string; // Base64 data URL
  timestamp: number;
  url: string;
}

const CACHE_KEY_PREFIX = 'r2m_avatar_cache_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

/**
 * Genera una clave de caché basada en la URL
 */
function getCacheKey(url: string): string {
  // Usar btoa para convertir la URL a base64 (más corto y único)
  try {
    return `${CACHE_KEY_PREFIX}${btoa(url).substring(0, 50)}`;
  } catch {
    // Fallback si la URL tiene caracteres especiales
    return `${CACHE_KEY_PREFIX}${url.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
}

/**
 * Guarda una imagen en caché
 */
export async function saveAvatarToCache(
  url: string,
  blob: Blob,
): Promise<void> {
  try {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        try {
          const base64data = reader.result as string;
          const cacheData: CacheData = {
            data: base64data,
            timestamp: Date.now(),
            url: url,
          };
          localStorage.setItem(getCacheKey(url), JSON.stringify(cacheData));
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading blob'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Silenciar errores de caché para no interrumpir la UX
  }
}

/**
 * Obtiene una imagen del caché
 */
export function getAvatarFromCache(url: string): string | null {
  try {
    const cacheKey = getCacheKey(url);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    // Verificar si el caché expiró
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cacheData.data;
  } catch {
    return null;
  }
}

/**
 * Limpia cachés antiguos (más de 7 días)
 */
export function cleanOldAvatarCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheData: CacheData = JSON.parse(cached);
            const age = now - cacheData.timestamp;

            if (age > CACHE_EXPIRY_MS) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Si hay error al parsear, eliminar la entrada corrupta
          localStorage.removeItem(key);
        }
      }
    }
  } catch {
    // Silenciar errores de limpieza
  }
}

/**
 * Elimina una entrada específica del caché
 */
export function removeAvatarFromCache(url: string): void {
  try {
    const cacheKey = getCacheKey(url);
    localStorage.removeItem(cacheKey);
  } catch {
    // Silenciar errores
  }
}

/**
 * Limpia todo el caché de avatares
 */
export function clearAllAvatarCache(): void {
  try {
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Silenciar errores
  }
}
