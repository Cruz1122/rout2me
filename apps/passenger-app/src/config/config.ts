/**
 * Configuración centralizada de variables de entorno
 * Este archivo asegura que las variables de entorno se incluyan correctamente
 * en los builds de producción, incluyendo Android.
 */

export const config = {
  // API Keys externas
  stadia: {
    apiKey: import.meta.env.VITE_STADIA_API_KEY || '',
  },

  // Backend URLs
  backend: {
    baseUrl: import.meta.env.VITE_BACKEND_BASE_URL || '',
    authUrl: import.meta.env.VITE_BACKEND_AUTH_URL || '',
    restUrl: import.meta.env.VITE_BACKEND_REST_URL || '',
    functionsUrl: import.meta.env.VITE_BACKEND_FUNCTIONS_URL || '',
  },

  // Supabase Keys
  supabase: {
    anonKey: import.meta.env.VITE_ANON_KEY || '',
    serviceRoleKey: import.meta.env.VITE_SERVICE_ROLE_KEY || '',
    publishableKey: import.meta.env.VITE_PUBLISHABLE_KEY || '',
  },

  // Modo de desarrollo
  isDevelopment:
    import.meta.env.DEV ||
    import.meta.env.MODE === 'development' ||
    window.location.hostname === 'localhost',
} as const;

/**
 * Helper para verificar si el map matching está disponible
 */
export const isMapMatchingAvailable = (): boolean => {
  return Boolean(config.stadia.apiKey && config.stadia.apiKey.trim() !== '');
};

/**
 * Helper para obtener la API key de Stadia de forma segura
 */
export const getStadiaApiKey = (): string | undefined => {
  const key = config.stadia.apiKey;
  return key && key.trim() !== '' ? key : undefined;
};
