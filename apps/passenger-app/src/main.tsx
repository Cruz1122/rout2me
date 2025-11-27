import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './theme/variables.css';
import './theme/tabs.css';
import './theme/search.css';
import './index.css';

import App from './App';
import { cacheService } from './shared/services/cacheService';
import { cacheCleanupService } from './shared/services/cacheCleanupService';
import { serviceWorkerService } from './features/system/services/serviceWorkerService';
import { assetPreloader } from './features/system/services/assetPreloader';
import {
  shouldDisableServiceWorker,
  shouldDisableCache,
  shouldEnableDebugLogs,
} from './config/developmentConfig';

// Helper para agregar timeout a promesas
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
    ),
  ]);
}

// Inicializar servicios de caché de forma no bloqueante
async function initializeCacheServices() {
  try {
    // Configurar logs de debug
    if (shouldEnableDebugLogs()) {
      localStorage.setItem('debug-cache', 'true');
    }

    // Verificar si el caché debe estar deshabilitado
    if (shouldDisableCache()) {
      console.log('Caché deshabilitado en desarrollo');
      return;
    }

    // Inicializar servicio de caché principal con timeout
    try {
      await withTimeout(
        cacheService.init(),
        2000, // 2 segundos máximo
        'Timeout inicializando caché',
      );
      console.log('Servicio de caché inicializado');
    } catch (error) {
      console.warn('Error o timeout inicializando caché:', error);
    }

    // Iniciar limpieza automática (no bloqueante)
    try {
      cacheCleanupService.startAutoCleanup();
      console.log('Servicio de limpieza automática iniciado');
    } catch (error) {
      console.warn('Error iniciando limpieza automática:', error);
    }

    // Registrar Service Worker solo si no está deshabilitado (con timeout)
    if (!shouldDisableServiceWorker()) {
      try {
        await withTimeout(
          serviceWorkerService.register(),
          3000, // 3 segundos máximo
          'Timeout registrando Service Worker',
        );
        console.log('Service Worker registrado');
      } catch (error) {
        console.warn('Error o timeout registrando Service Worker:', error);
      }
    } else {
      console.log('Service Worker deshabilitado en desarrollo');
    }

    // Iniciar precarga de assets críticos en background (no bloqueante)
    // No esperamos a que termine, se ejecuta en background
    assetPreloader.preloadAll().catch((error) => {
      console.warn('Error durante precarga de assets:', error);
    });
  } catch (error) {
    console.error('Error al inicializar servicios de caché:', error);
  }
}

// Renderizar la app inmediatamente sin esperar servicios
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Inicializar servicios en background (no bloqueante)
initializeCacheServices().catch((error) => {
  console.error('Error crítico inicializando servicios:', error);
});
