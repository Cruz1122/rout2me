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
  },
];

export const favoriteRoutes = mockRoutes.filter((route) => route.isFavorite);

// Rutas recientes (últimas 3 rutas usadas)
export const recentRoutes = [mockRoutes[2], mockRoutes[3], mockRoutes[4]];
