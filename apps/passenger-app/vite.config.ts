import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // NO separar React - debe estar en el chunk principal para evitar problemas de dependencias
          // Separar vendor libraries (excepto React que se queda en el chunk principal)
          if (id.includes('node_modules')) {
            // React y React-DOM se quedan en el chunk principal (no retornamos nada)
            if (id.includes('react') || id.includes('react-dom')) {
              return undefined; // Mantener en chunk principal
            }
            if (id.includes('@ionic/react') || id.includes('ionicons')) {
              return 'vendor-ionic';
            }
            if (id.includes('maplibre-gl')) {
              return 'vendor-maplibre';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('fuse.js')) {
              return 'vendor-fuse';
            }
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'vendor-supabase';
            }
            // Otros vendor libraries
            return 'vendor-other';
          }

          // NO separar HomePage ni sus dependencias directas - mantener en chunk principal
          // para evitar problemas de dependencias circulares
          if (
            id.includes('features/system/pages/HomePage') ||
            id.includes('features/routes/hooks/useRouteDrawing') ||
            id.includes('features/routes/hooks/useBusMapping') ||
            id.includes('features/system/hooks/useMapInitialization') ||
            id.includes('features/system/hooks/useMapEventHandlers') ||
            id.includes('features/system/hooks/useRouteSelection')
          ) {
            return undefined; // Mantener en chunk principal
          }

          // Separar otras páginas
          if (id.includes('features/routes/pages')) {
            return 'feature-routes';
          }
          if (id.includes('features/routes/services')) {
            return 'feature-routes-services';
          }
          if (id.includes('shared/services')) {
            return 'shared-services';
          }
        },
      },
      treeshake: {
        moduleSideEffects: false,
      },
    },
    // Reducir límite de advertencia para forzar optimización
    chunkSizeWarningLimit: 500,
    // Usar esbuild (más rápido que terser y viene por defecto)
    minify: 'esbuild',
  },
});
