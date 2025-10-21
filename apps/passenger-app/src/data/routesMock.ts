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
    // Ruta mejorada: Centro de Manizales -> Chipre (más puntos para mejor map matching)
    coordinates: [
      [-75.5138, 5.0703], // Plaza de Bolívar
      [-75.5145, 5.071], // Calle 22
      [-75.5152, 5.0718], // Calle 23
      [-75.516, 5.0728], // Av. Santander
      [-75.517, 5.0738], // Barrio Chipre
      [-75.518, 5.0748], // Alto Chipre
      [-75.519, 5.0758], // Mirador
    ],
    color: 'var(--color-secondary)', // #1E56A0
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
    // Ruta mejorada: Cable Plaza -> La Enea
    coordinates: [
      [-75.49, 5.065], // Cable Plaza inicio
      [-75.492, 5.066], // Hacia La Enea
      [-75.494, 5.067], // Av. Paralela
      [-75.496, 5.068], // Cruce importante
      [-75.498, 5.069], // Zona comercial
      [-75.5, 5.07], // Cerca del centro
      [-75.502, 5.071], // Centro
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
    // Ruta mejorada: Centro -> Palogrande
    coordinates: [
      [-75.5138, 5.0703], // Centro
      [-75.5128, 5.071], // Av. Santander
      [-75.5118, 5.072], // Hacia Palogrande
      [-75.5108, 5.073], // Zona universitaria
      [-75.5098, 5.074], // Cable
      [-75.5088, 5.075], // Palogrande
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
    // Ruta mejorada: Versalles -> Centro
    coordinates: [
      [-75.53, 5.06], // Versalles
      [-75.528, 5.062], // Hacia el centro
      [-75.526, 5.064], // Av. 12 de Octubre
      [-75.524, 5.066], // Zona comercial
      [-75.522, 5.068], // Cerca del centro
      [-75.52, 5.0695], // Centro histórico
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
    // Ruta mejorada: Centro -> Milán
    coordinates: [
      [-75.5138, 5.0703], // Plaza de Bolívar
      [-75.515, 5.069], // Hacia el sur
      [-75.5165, 5.0675], // Av. Centenario
      [-75.518, 5.066], // Milán zona norte
      [-75.5195, 5.0645], // Milán centro
      [-75.521, 5.063], // Milán sur
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
    // Ruta mejorada: Circuito urbano completo
    coordinates: [
      [-75.52, 5.08], // Punto norte
      [-75.518, 5.078], //
      [-75.516, 5.076], //
      [-75.514, 5.074], //
      [-75.512, 5.072], //
      [-75.5138, 5.0703], // Centro
      [-75.515, 5.069], // Hacia el sur
      [-75.517, 5.067], // Punto sur
    ],
    color: '#607D8B',
  },
];

export const favoriteRoutes = mockRoutes.filter((route) => route.isFavorite);

// Rutas recientes (últimas 3 rutas usadas)
export const recentRoutes = [mockRoutes[2], mockRoutes[3], mockRoutes[4]];
