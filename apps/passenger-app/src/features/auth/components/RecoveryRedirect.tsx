import { useEffect } from 'react';

/**
 * Componente que detecta tokens de recuperación en la URL y redirige automáticamente
 */
export default function RecoveryRedirect() {
  // Verificar inmediatamente cuando el componente se monta (solo una vez)
  useEffect(() => {
    const hash = globalThis.location.hash;
    const search = globalThis.location.search;

    // Solo verificar si hay parámetros que parezcan de Supabase
    // Supabase siempre incluye 'access_token', 'error', o 'type' en sus URLs
    const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;
    const searchParams = search ? new URLSearchParams(search) : null;

    // Verificar si este hash/search contiene parámetros de Supabase
    const hasSupabaseParams =
      (hashParams &&
        (hashParams.has('access_token') ||
          hashParams.has('error') ||
          hashParams.has('type'))) ||
      (searchParams &&
        searchParams.has('type') &&
        searchParams.get('type') === 'recovery');

    // Si no hay parámetros de Supabase, no hacer nada
    if (!hasSupabaseParams) {
      return;
    }

    console.log('🔍 RecoveryRedirect - Hash:', hash);
    console.log('🔍 RecoveryRedirect - Search:', search);
    console.log('🔍 RecoveryRedirect - Full URL:', globalThis.location.href);

    // Verificar en el hash (después de que Supabase redirige)
    if (hashParams) {
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');

      // Si hay un error de token expirado
      if (error === 'access_denied' && errorCode === 'otp_expired') {
        console.log(
          '❌ Token expirado detectado en hash, redirigiendo a /expired-link',
        );
        globalThis.location.href = '/expired-link';
        return;
      }

      // Si es un enlace de recuperación y NO estamos ya en /reset-password
      if (
        type === 'recovery' &&
        accessToken &&
        !globalThis.location.pathname.includes('/reset-password')
      ) {
        console.log(
          '🔐 Enlace de recuperación detectado en hash, redirigiendo a /reset-password con hash preservado',
        );

        // Redirigir preservando el hash
        globalThis.location.href = `/reset-password${hash}`;
        return;
      }
    }

    // También verificar en query params (antes de que Supabase procese)
    if (searchParams && searchParams.get('type') === 'recovery') {
      console.log(
        '🔐 Enlace de verificación de recuperación detectado, esperando redirección de Supabase...',
      );
      // No hacer nada aquí, Supabase redirigirá con el hash
    }
  }, []); // Solo ejecutar una vez al montar

  return null;
}
