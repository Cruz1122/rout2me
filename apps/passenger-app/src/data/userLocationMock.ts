import type { BusLocation } from '../services/busService';

/**
 * Mock de ubicaciones del usuario en diferentes puntos de Manizales
 * Cambia la ubicación activa para simular diferentes escenarios de distancia
 */

// Centro de Manizales (referencia principal)
export const CENTRO_MANIZALES: BusLocation = {
  latitude: 5.0703,
  longitude: -75.5138,
};

// Cable Plaza (zona comercial norte)
export const CABLE_PLAZA: BusLocation = {
  latitude: 5.0689,
  longitude: -75.4842,
};

// Universidad de Caldas (zona universitaria)
export const UNIVERSIDAD_CALDAS: BusLocation = {
  latitude: 5.0613,
  longitude: -75.4906,
};

// Palermo (zona residencial)
export const PALERMO: BusLocation = {
  latitude: 5.0458,
  longitude: -75.4856,
};

// Milán (sur de la ciudad)
export const MILAN: BusLocation = {
  latitude: 5.0333,
  longitude: -75.4917,
};

// La Enea (zona alta norte)
export const LA_ENEA: BusLocation = {
  latitude: 5.0825,
  longitude: -75.4975,
};

// Terminal de Transportes
export const TERMINAL: BusLocation = {
  latitude: 5.0428,
  longitude: -75.4747,
};

// Estadio Palogrande
export const ESTADIO: BusLocation = {
  latitude: 5.0542,
  longitude: -75.4856,
};

// State management for user location
let currentUserLocation: BusLocation = { ...CENTRO_MANIZALES };
const listeners: Set<() => void> = new Set();

export const userLocationState = {
  get: (): BusLocation => currentUserLocation,
  set: (newLocation: BusLocation) => {
    currentUserLocation = { ...newLocation };
    for (const listener of listeners) {
      listener();
    }
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * Ubicación actual del usuario (mock) - Para compatibilidad
 * @deprecated Use userLocationState.get() for reactive updates
 */
export const userLocation: BusLocation = CENTRO_MANIZALES;

// Lista de todas las ubicaciones disponibles para referencia
export const AVAILABLE_LOCATIONS = {
  CENTRO_MANIZALES,
  CABLE_PLAZA,
  UNIVERSIDAD_CALDAS,
  PALERMO,
  MILAN,
  LA_ENEA,
  TERMINAL,
  ESTADIO,
} as const;

export type LocationName = keyof typeof AVAILABLE_LOCATIONS;
