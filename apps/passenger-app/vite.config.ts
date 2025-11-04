import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor libraries
          vendor: ['react', 'react-dom'],
          // Separar Ionic components
          ionic: ['@ionic/react', 'ionicons'],
          // Separar MapLibre (no mapbox-gl)
          maplibre: ['maplibre-gl'],
          // Separar servicios grandes
          services: [
            './src/features/routes/services/busService.ts',
            './src/features/routes/services/routeService.ts',
            './src/shared/services/cacheService.ts',
          ],
          // Separar HomePage que es muy grande (ruta nueva)
          homepage: ['./src/features/system/pages/HomePage.tsx'],
        },
      },
    },
    // Aumentar el límite de advertencia de tamaño
    chunkSizeWarningLimit: 1000,
  },
});
