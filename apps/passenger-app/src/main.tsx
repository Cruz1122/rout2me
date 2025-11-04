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

// Inicializar servicios de caché
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

    // Inicializar servicio de caché principal
    await cacheService.init();
    console.log('Servicio de caché inicializado');

    // Iniciar limpieza automática
    cacheCleanupService.startAutoCleanup();
    console.log('Servicio de limpieza automática iniciado');

    // Registrar Service Worker solo si no está deshabilitado
    if (!shouldDisableServiceWorker()) {
      await serviceWorkerService.register();
      console.log('Service Worker registrado');
    } else {
      console.log('Service Worker deshabilitado en desarrollo');
    }

    // Iniciar precarga de assets críticos
    await assetPreloader.preloadAll();
    console.log('Precarga de assets completada');
  } catch (error) {
    console.error('Error al inicializar servicios de caché:', error);
  }
}

// Inicializar servicios antes de renderizar la app
initializeCacheServices().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
