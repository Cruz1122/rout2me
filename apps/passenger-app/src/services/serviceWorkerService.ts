/**
 * Servicio para gestionar el Service Worker
 * Proporciona una interfaz para registrar, actualizar y gestionar el SW
 */

import { getServiceWorkerConfig } from '../config/serviceWorkerConfig';

export interface ServiceWorkerConfig {
  swPath: string;
  scope: string;
  updateCheckInterval: number;
}

export class ServiceWorkerService {
  private static instance: ServiceWorkerService;
  private config: ServiceWorkerConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = {
      swPath: '/sw.js',
      scope: '/',
      updateCheckInterval: 60 * 1000, // 1 minuto
      ...config,
    };
  }

  static getInstance(
    config?: Partial<ServiceWorkerConfig>,
  ): ServiceWorkerService {
    if (!ServiceWorkerService.instance) {
      ServiceWorkerService.instance = new ServiceWorkerService(config);
    }
    return ServiceWorkerService.instance;
  }

  /**
   * Registra el Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    // Verificar si el Service Worker debe estar habilitado
    const swConfig = getServiceWorkerConfig();
    if (!swConfig.enabled) {
      console.log('Service Worker deshabilitado por configuración');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker no soportado en este navegador');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        this.config.swPath,
        { scope: this.config.scope },
      );

      console.log('Service Worker registrado correctamente');

      // Configurar listeners
      this.setupEventListeners();

      // Iniciar verificación de actualizaciones
      this.startUpdateCheck();

      return this.registration;
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
      return null;
    }
  }

  /**
   * Configura los event listeners del Service Worker
   */
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listener para actualizaciones
    this.registration.addEventListener('updatefound', () => {
      console.log('Nueva versión del Service Worker encontrada');

      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('Nueva versión lista para activar');
            this.notifyUpdateAvailable();
          }
        });
      }
    });

    // Listener para mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Maneja mensajes del Service Worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Caché actualizado:', payload);
        break;

      case 'CACHE_ERROR':
        console.error('Error en caché:', payload);
        break;

      default:
        console.log('Mensaje del Service Worker:', event.data);
    }
  }

  /**
   * Inicia la verificación periódica de actualizaciones
   */
  private startUpdateCheck(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }

    this.updateCheckTimer = setInterval(async () => {
      await this.checkForUpdates();
    }, this.config.updateCheckInterval);
  }

  /**
   * Verifica si hay actualizaciones disponibles
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Error al verificar actualizaciones:', error);
      return false;
    }
  }

  /**
   * Notifica que hay una actualización disponible
   */
  private notifyUpdateAvailable(): void {
    // Emitir evento personalizado
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.dispatchEvent(
        new CustomEvent('sw-update-available', {
          detail: { registration: this.registration },
        }),
      );
    }
  }

  /**
   * Actualiza el Service Worker
   */
  async updateServiceWorker(): Promise<boolean> {
    if (!this.registration || !this.registration.waiting) {
      return false;
    }

    try {
      // Enviar mensaje al Service Worker para que se active
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Recargar la página después de un breve delay
      setTimeout(() => {
        globalThis.location.reload();
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error al actualizar Service Worker:', error);
      return false;
    }
  }

  /**
   * Limpia el caché del Service Worker
   */
  async clearCache(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'CLEAN_CACHE' },
          [messageChannel.port2],
        );
      });
    } catch (error) {
      console.error('Error al limpiar caché:', error);
      return false;
    }
  }

  /**
   * Obtiene el tamaño del caché
   */
  async getCacheSize(): Promise<number> {
    if (!this.registration) return 0;

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.size || 0);
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2],
        );
      });
    } catch (error) {
      console.error('Error al obtener tamaño del caché:', error);
      return 0;
    }
  }

  /**
   * Obtiene información del Service Worker
   */
  getServiceWorkerInfo(): {
    isSupported: boolean;
    isRegistered: boolean;
    isActive: boolean;
    isControlling: boolean;
    scope: string;
  } {
    const isSupported = 'serviceWorker' in navigator;
    const isRegistered = !!this.registration;
    const isActive = !!this.registration?.active;
    const isControlling = !!navigator.serviceWorker.controller;

    return {
      isSupported,
      isRegistered,
      isActive,
      isControlling,
      scope: this.config.scope,
    };
  }

  /**
   * Desregistra el Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      // Detener verificación de actualizaciones
      if (this.updateCheckTimer) {
        clearInterval(this.updateCheckTimer);
        this.updateCheckTimer = null;
      }

      // Desregistrar
      const result = await this.registration.unregister();
      this.registration = null;

      console.log('Service Worker desregistrado');
      return result;
    } catch (error) {
      console.error('Error al desregistrar Service Worker:', error);
      return false;
    }
  }

  /**
   * Detiene el servicio
   */
  stop(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
  }
}

// Instancia singleton
export const serviceWorkerService = ServiceWorkerService.getInstance();
