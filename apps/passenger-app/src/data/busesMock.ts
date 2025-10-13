export interface BusLocation {
  latitude: number;
  longitude: number;
}

export interface Bus {
  id: string;
  routeNumber: string;
  routeName: string;
  occupancy: 'low' | 'medium' | 'high';
  status: 'active' | 'nearby' | 'offline';
  licensePlate?: string;
  currentCapacity: number;
  maxCapacity: number;
  location: BusLocation;
}

// Re-export user location from mock
export { userLocation } from './userLocationMock';

export const mockBuses: Bus[] = [
  {
    id: 'bus-506-1',
    routeNumber: '506',
    routeName: 'Ruta Maipú',
    occupancy: 'low',
    status: 'active',
    licensePlate: 'ABC-123',
    currentCapacity: 12,
    maxCapacity: 40,
    location: {
      latitude: 5.0925,
      longitude: -75.5338,
    },
  },
  {
    id: 'bus-502-1',
    routeNumber: '502',
    routeName: 'Ruta Centro',
    occupancy: 'medium',
    status: 'active',
    licensePlate: 'DEF-456',
    currentCapacity: 28,
    maxCapacity: 40,
    location: {
      latitude: 5.0856,
      longitude: -75.5238,
    },
  },
  {
    id: 'bus-503-1',
    routeNumber: '503',
    routeName: 'Ruta Norte',
    occupancy: 'high',
    status: 'active',
    licensePlate: 'GHI-789',
    currentCapacity: 38,
    maxCapacity: 40,
    location: {
      latitude: 5.0995,
      longitude: -75.5438,
    },
  },
  {
    id: 'bus-501-1',
    routeNumber: '501',
    routeName: 'Ruta Sur',
    occupancy: 'low',
    status: 'offline',
    licensePlate: 'JKL-012',
    currentCapacity: 0,
    maxCapacity: 40,
    location: {
      latitude: 5.0403,
      longitude: -75.4938,
    },
  },
  {
    id: 'bus-204-1',
    routeNumber: '204',
    routeName: 'Ruta Ñuñoa',
    occupancy: 'medium',
    status: 'active',
    licensePlate: 'MNO-345',
    currentCapacity: 25,
    maxCapacity: 40,
    location: {
      latitude: 5.1103,
      longitude: -75.5638,
    },
  },
  {
    id: 'bus-301-1',
    routeNumber: '301',
    routeName: 'Ruta Florida',
    occupancy: 'low',
    status: 'nearby',
    licensePlate: 'PQR-678',
    currentCapacity: 10,
    maxCapacity: 40,
    location: {
      latitude: 5.0753,
      longitude: -75.5188,
    },
  },
];

// Buses activos (en línea)
export const activeBuses = mockBuses.filter((bus) => bus.status === 'active');

// Buses cercanos (a menos de 1km)
export const nearbyBuses = mockBuses.filter((bus) => bus.status === 'nearby');

// Buses fuera de servicio
export const offlineBuses = mockBuses.filter((bus) => bus.status === 'offline');
