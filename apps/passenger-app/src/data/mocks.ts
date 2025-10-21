import type { Stop, Route } from '../types/search';

// Mock data para Manizales (corrigiendo coordenadas: lng, lat)
export const mockStops: Stop[] = [
  {
    id: 'stop-1',
    name: 'Paradero Central',
    code: 'PC001',
    tags: ['centro', 'principal', 'terminal'],
    type: 'stop',
    lat: 5.0703,
    lng: -75.5138,
    routes: ['R101', 'R102', 'R201'],
  },
  {
    id: 'stop-2',
    name: 'Universidad Nacional',
    code: 'UN001',
    tags: ['universidad', 'estudiantes', 'campus'],
    type: 'stop',
    lat: 5.065,
    lng: -75.5,
    routes: ['R101', 'R301'],
  },
  {
    id: 'stop-3',
    name: 'Hospital Caldas',
    code: 'HC001',
    tags: ['hospital', 'salud', 'emergencia'],
    type: 'stop',
    lat: 5.075,
    lng: -75.52,
    routes: ['R102', 'R201'],
  },
  {
    id: 'stop-4',
    name: 'Centro Comercial Fundadores',
    code: 'CCF001',
    tags: ['centro comercial', 'compras', 'fundadores'],
    type: 'stop',
    lat: 5.068,
    lng: -75.51,
    routes: ['R301', 'R401'],
  },
  {
    id: 'stop-5',
    name: 'Alcaldía de Manizales',
    code: 'AM001',
    tags: ['alcaldía', 'gobierno', 'municipal'],
    type: 'stop',
    lat: 5.071,
    lng: -75.512,
    routes: ['R101', 'R102'],
  },
  {
    id: 'stop-6',
    name: 'Terminal de Transportes',
    code: 'TT001',
    tags: ['terminal', 'transporte', 'intercity'],
    type: 'stop',
    lat: 5.062,
    lng: -75.498,
    routes: ['R201', 'R401'],
  },
  {
    id: 'stop-7',
    name: 'Parque Caldas',
    code: 'PKC001',
    tags: ['parque', 'recreación', 'centro'],
    type: 'stop',
    lat: 5.07,
    lng: -75.514,
    routes: ['R101', 'R301'],
  },
  {
    id: 'stop-8',
    name: 'Universidad de Caldas',
    code: 'UC001',
    tags: ['universidad', 'caldas', 'educación', 'sede principal'],
    type: 'stop',
    lat: 5.0556,
    lng: -75.4934,
    routes: ['R102', 'R401'],
  },
  {
    id: 'stop-9',
    name: 'Centro',
    code: 'CT001',
    tags: ['centro', 'comercio', 'negocios'],
    type: 'stop',
    lat: 5.0705,
    lng: -75.513,
    routes: ['R101', 'R201', 'R301'],
  },
  {
    id: 'stop-10',
    name: 'La Enea',
    code: 'LE001',
    tags: ['la enea', 'residencial', 'barrio'],
    type: 'stop',
    lat: 5.058,
    lng: -75.495,
    routes: ['R401'],
  },
];

export const mockRoutes: Route[] = [
  {
    id: 'route-1',
    name: 'Ruta Centro - Universidad Nacional',
    code: 'R101',
    tags: ['centro', 'universidad', 'estudiantes'],
    type: 'route',
    fare: 2500,
    stops: ['stop-1', 'stop-2', 'stop-5', 'stop-7', 'stop-9'],
    coordinates: [
      [-75.5138, 5.0703], // Centro de Manizales
      [-75.5, 5.065], // Universidad Nacional
      [-75.512, 5.071], // Alcaldía
      [-75.514, 5.07], // Parque Caldas
      [-75.513, 5.0705], // Centro
    ],
    color: '#1E56A0',
  },
  {
    id: 'route-2',
    name: 'Ruta Hospital - Terminal',
    code: 'R102',
    tags: ['hospital', 'terminal', 'salud'],
    type: 'route',
    fare: 2500,
    stops: ['stop-3', 'stop-6', 'stop-5', 'stop-8'],
    coordinates: [
      [-75.52, 5.075], // Hospital Caldas
      [-75.498, 5.062], // Terminal de Transportes
      [-75.512, 5.071], // Alcaldía
      [-75.4934, 5.0556], // Universidad de Caldas
    ],
    color: '#1E56A0',
  },
  {
    id: 'route-3',
    name: 'Ruta Fundadores Express',
    code: 'R201',
    tags: ['fundadores', 'express', 'rápida'],
    type: 'route',
    fare: 3000,
    stops: ['stop-1', 'stop-3', 'stop-6', 'stop-9'],
    coordinates: [
      [-75.5138, 5.0703], // Paradero Central
      [-75.52, 5.075], // Hospital Caldas
      [-75.498, 5.062], // Terminal de Transportes
      [-75.513, 5.0705], // Centro
    ],
    color: '#1E56A0',
  },
  {
    id: 'route-4',
    name: 'Ruta Universitaria',
    code: 'R301',
    tags: ['universitaria', 'estudiantes', 'campus'],
    type: 'route',
    fare: 2200,
    stops: ['stop-2', 'stop-4', 'stop-7', 'stop-9'],
    coordinates: [
      [-75.5, 5.065], // Universidad Nacional
      [-75.51, 5.068], // Centro Comercial Fundadores
      [-75.514, 5.07], // Parque Caldas
      [-75.513, 5.0705], // Centro
    ],
    color: '#1E56A0',
  },
  {
    id: 'route-5',
    name: 'Ruta La Enea - Centro',
    code: 'R401',
    tags: ['la enea', 'centro', 'barrios'],
    type: 'route',
    fare: 2800,
    stops: ['stop-10', 'stop-4', 'stop-6', 'stop-8'],
    coordinates: [
      [-75.495, 5.058], // La Enea
      [-75.51, 5.068], // Centro Comercial Fundadores
      [-75.498, 5.062], // Terminal de Transportes
      [-75.4934, 5.0556], // Universidad de Caldas
    ],
    color: '#1E56A0',
  },
];

export const mockSearchData = [...mockStops, ...mockRoutes];
