import { isNativePlatform } from './platform';

export const NATIVE_OAUTH_CALLBACK = 'rout2me://auth/callback';

/**
 * Obtiene la URL de redirección correcta para OAuth.
 * En móvil usa el esquema de deep link de la app.
 * En web usa location.origin para mantener la experiencia tradicional.
 */
export function getOAuthRedirectUrl(path: string = '/inicio'): string {
  if (isNativePlatform()) {
    return NATIVE_OAUTH_CALLBACK;
  }

  if (typeof globalThis.location !== 'undefined') {
    return `${globalThis.location.origin}${path}`;
  }

  return path;
}

/**
 * Obtiene todas las URLs de redirección permitidas para OAuth
 * para registrarlas en Supabase.
 */
export function getAllowedRedirectUrls(): string[] {
  const urls: string[] = [NATIVE_OAUTH_CALLBACK];

  if (typeof globalThis.location !== 'undefined') {
    const origin = globalThis.location.origin;
    urls.push(`${origin}/auth-callback.html`);
    urls.push(`${origin}/inicio`);
  }

  return urls;
}
