export const APP_NAME = 'rout2me';

// Geo types
export type LatLng = {
  lat: number;
  lng: number;
};

export type VehiclePing = {
  id: string;
  ts: string;
  pos: LatLng;
  speed?: number;
};

// Result utility type
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Legacy types (mantener compatibilidad)
export interface User {
  id: string;
  name: string;
  email: string;
}

export type BusLocation = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
};

// Export utilities
export * from './geo-utils';
export * from './result-utils';
export * from './supabaseClient';
export * as AuthApi from './api/auth';
export * as BusesApi from './api/buses';
