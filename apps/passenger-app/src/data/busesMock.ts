export interface Bus {
  id: string;
  routeNumber: string;
  routeName: string;
  distance: string;
  occupancy: 'low' | 'medium' | 'high';
  status: 'active' | 'nearby' | 'offline';
  licensePlate?: string;
}

export const mockBuses: Bus[] = [
  {
    id: 'bus-506-1',
    routeNumber: '506',
    routeName: 'Ruta Maipú',
    distance: 'A 2.5km',
    occupancy: 'low',
    status: 'active',
    licensePlate: 'ABC-123',
  },
  {
    id: 'bus-502-1',
    routeNumber: '502',
    routeName: 'Ruta Centro',
    distance: 'A 1.8km',
    occupancy: 'medium',
    status: 'active',
    licensePlate: 'DEF-456',
  },
  {
    id: 'bus-503-1',
    routeNumber: '503',
    routeName: 'Ruta Norte',
    distance: 'A 3.2km',
    occupancy: 'high',
    status: 'active',
    licensePlate: 'GHI-789',
  },
  {
    id: 'bus-501-1',
    routeNumber: '501',
    routeName: 'Ruta Sur',
    distance: 'Fuera de servicio',
    occupancy: 'low',
    status: 'offline',
    licensePlate: 'JKL-012',
  },
  {
    id: 'bus-204-1',
    routeNumber: '204',
    routeName: 'Ruta Ñuñoa',
    distance: 'A 4.1km',
    occupancy: 'medium',
    status: 'active',
    licensePlate: 'MNO-345',
  },
  {
    id: 'bus-301-1',
    routeNumber: '301',
    routeName: 'Ruta Florida',
    distance: 'A 0.8km',
    occupancy: 'low',
    status: 'nearby',
    licensePlate: 'PQR-678',
  },
];

// Buses activos (en línea)
export const activeBuses = mockBuses.filter((bus) => bus.status === 'active');

// Buses cercanos (a menos de 1km)
export const nearbyBuses = mockBuses.filter((bus) => bus.status === 'nearby');

// Buses fuera de servicio
export const offlineBuses = mockBuses.filter((bus) => bus.status === 'offline');
