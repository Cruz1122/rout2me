/**
 * Utilidades para detectar características del dispositivo
 * y ajustar configuraciones de rendimiento
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasSlowConnection: boolean;
  devicePixelRatio: number;
}

/**
 * Detecta si el dispositivo es móvil
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Detectar por user agent
  const userAgent = navigator.userAgent || navigator.vendor;
  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

  // Detectar por tamaño de pantalla (móvil típicamente < 768px)
  const isSmallScreen = window.innerWidth < 768;

  return mobileRegex.test(userAgent) || isSmallScreen;
}

/**
 * Detecta si el dispositivo es tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor;
  const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
  const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1024;

  return tabletRegex.test(userAgent) || isMediumScreen;
}

/**
 * Detecta si hay conexión lenta
 */
export function hasSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  interface NetworkConnection {
    effectiveType?: string;
    downlink?: number;
  }

  const connection = (navigator as { connection?: NetworkConnection })
    .connection;
  if (!connection) return false;

  const effectiveType = connection.effectiveType;
  if (effectiveType) {
    // 'slow-2g', '2g', '3g' se consideran lentas
    return ['slow-2g', '2g'].includes(effectiveType);
  }

  const downlink = connection.downlink;
  if (downlink !== undefined) {
    // Menos de 1.5 Mbps se considera lento
    return downlink < 1.5;
  }

  return false;
}

/**
 * Obtiene información completa del dispositivo
 */
export function getDeviceInfo(): DeviceInfo {
  const devicePixelRatio =
    typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  return {
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isDesktop: !isMobileDevice() && !isTabletDevice(),
    hasSlowConnection: hasSlowConnection(),
    devicePixelRatio,
  };
}

/**
 * Detecta si el usuario prefiere movimiento reducido
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Obtiene la duración de animación optimizada según el dispositivo
 */
export function getOptimizedAnimationDuration(baseDuration: number): number {
  if (prefersReducedMotion()) {
    return 0; // Sin animación si el usuario prefiere movimiento reducido
  }

  const deviceInfo = getDeviceInfo();
  if (deviceInfo.hasSlowConnection) {
    return baseDuration * 0.5; // Reducir duración en conexiones lentas
  }

  if (deviceInfo.isMobile) {
    return baseDuration * 0.8; // Reducir ligeramente en móvil
  }

  return baseDuration;
}
