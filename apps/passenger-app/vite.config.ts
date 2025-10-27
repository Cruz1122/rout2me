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
            './src/services/busService.ts',
            './src/services/routeService.ts',
            './src/services/cacheService.ts',
          ],
          // Separar HomePage que es muy grande
          homepage: ['./src/pages/HomePage.tsx'],
        },
      },
    },
    // Aumentar el límite de advertencia de tamaño
    chunkSizeWarningLimit: 1000,
  },
});
