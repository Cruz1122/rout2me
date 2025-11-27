import { Capacitor } from '@capacitor/core';

/**
 * Detecta si la app está corriendo en una plataforma móvil nativa
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Detecta si la app está corriendo en Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Detecta si la app está corriendo en iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Detecta si la app está corriendo en web
 */
export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web';
}

/**
 * Obtiene la plataforma actual
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}
