import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rout2me.passenger',
  appName: 'Rout2Me',
  webDir: 'dist',
  server: {
    // Forzar https esquema nativo para que Google no bloquee OAuth
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
    App: {
      // Permite abrir enlaces rout2me:// desde navegadores nativos
      allowScheme: 'rout2me',
    },
  },
  android: {
    // Configurar intent filters para deep links
    allowMixedContent: true,
  },
  ios: {
    // Configurar URL schemes para deep links
    scheme: 'com.rout2me.passenger',
  },
};

export default config;
