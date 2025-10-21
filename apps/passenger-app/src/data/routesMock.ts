export interface Route {
  id: string;
  number: string;
  name: string;
  origin: string;
  destination: string;
  via: string;
  duration: number;
  fare: number;
  activeBuses: number;
  status: 'active' | 'offline';
  isFavorite?: boolean;
  nextBus?: number;
  // Coordenadas de la ruta para dibujar en el mapa
  coordinates?: [number, number][]; // Array de [lng, lat]
  color?: string; // Color de la línea en el mapa
}

export const mockRoutes: Route[] = [
  {
    id: '506',
    number: '506',
    name: 'Maipú ↔ Peñalolén',
    origin: 'Maipú',
    destination: 'Peñalolén',
    via: 'Av. Providencia',
    duration: 45,
    fare: 800,
    activeBuses: 3,
    status: 'active',
    isFavorite: true,
    nextBus: 5,
    // Coordenadas de ejemplo para Manizales
    coordinates: [
      [-75.5138, 5.0703], // Centro de Manizales
      [-75.52, 5.075], // Punto intermedio 1
      [-75.53, 5.08], // Punto intermedio 2
      [-75.54, 5.085], // Punto final
    ],
    color: '#1E56A0',
  },
  {
    id: '102',
    number: '102',
    name: 'Las Condes ↔ Puente Alto',
    origin: 'Las Condes',
    destination: 'Puente Alto',
    via: 'Gran Av.',
    duration: 52,
    fare: 800,
    activeBuses: 2,
    status: 'active',
    isFavorite: true,
    nextBus: 8,
    coordinates: [
      [-75.5, 5.06], // Punto inicial
      [-75.51, 5.065], // Punto intermedio 1
      [-75.525, 5.07], // Punto intermedio 2
      [-75.535, 5.075], // Punto final
    ],
    color: '#FF6B35',
  },
  {
    id: '501',
    number: '501',
    name: 'Centro ↔ Quilicura',
    origin: 'Centro',
    destination: 'Quilicura',
    via: 'Independencia',
    duration: 38,
    fare: 800,
    activeBuses: 4,
    status: 'active',
    nextBus: 3,
    coordinates: [
      [-75.515, 5.072], // Punto inicial
      [-75.505, 5.068], // Punto intermedio 1
      [-75.495, 5.064], // Punto intermedio 2
      [-75.485, 5.06], // Punto final
    ],
    color: '#4CAF50',
  },
  {
    id: '204',
    number: '204',
    name: 'Ñuñoa ↔ Estación Central',
    origin: 'Ñuñoa',
    destination: 'Estación Central',
    via: 'Gran Av. / Grecia',
    duration: 35,
    fare: 400,
    activeBuses: 5,
    status: 'active',
    nextBus: 6,
    coordinates: [
      [-75.52, 5.075], // Punto inicial
      [-75.515, 5.07], // Punto intermedio 1
      [-75.51, 5.065], // Punto intermedio 2
      [-75.505, 5.06], // Punto final
    ],
    color: '#9C27B0',
  },
  {
    id: '301',
    number: '301',
    name: 'La Florida ↔ Providencia',
    origin: 'La Florida',
    destination: 'Providencia',
    via: 'Vicuña Mackenna',
    duration: 42,
    fare: 400,
    activeBuses: 1,
    status: 'active',
    nextBus: 12,
    coordinates: [
      [-75.53, 5.08], // Punto inicial
      [-75.525, 5.075], // Punto intermedio 1
      [-75.52, 5.07], // Punto intermedio 2
      [-75.515, 5.065], // Punto final
    ],
    color: '#FF9800',
  },
  {
    id: '105',
    number: '105',
    name: 'San Bernardo ↔ Las Condes',
    origin: 'San Bernardo',
    destination: 'Las Condes',
    via: 'Vicuña Mackenna',
    duration: 65,
    fare: 800,
    activeBuses: 0,
    status: 'offline',
    coordinates: [
      [-75.54, 5.085], // Punto inicial
      [-75.535, 5.08], // Punto intermedio 1
      [-75.53, 5.075], // Punto intermedio 2
      [-75.525, 5.07], // Punto final
    ],
    color: '#607D8B',
  },
];

export const favoriteRoutes = mockRoutes.filter((route) => route.isFavorite);

// Rutas recientes (últimas 3 rutas usadas)
export const recentRoutes = [mockRoutes[2], mockRoutes[3], mockRoutes[4]];
