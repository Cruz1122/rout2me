export interface Stop {
  id: string;
  name: string;
  code: string;
  tags: string[];
  type: 'stop';
  lat: number;
  lng: number;
  routes?: string[];
}

export interface Route {
  id: string;
  name: string;
  code: string;
  tags: string[];
  type: 'route';
  fare?: number;
  stops?: string[];
  // Coordenadas de la ruta para dibujar en el mapa
  coordinates?: [number, number][]; // Array de [lng, lat]
  color?: string; // Color de la línea en el mapa
  // Paradas completas para mostrar en el mapa
  routeStops?: Array<{
    id: string;
    name: string;
    location: [number, number]; // [lng, lat]
  }>;
}

export type SearchItem = Stop | Route;

export interface SearchFilters {
  onlyStops: boolean;
  onlyRoutes: boolean;
  fareRange?: {
    min: number;
    max: number;
  };
}

// Props para componentes
export interface R2MSearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: (value: string) => void;
  readonly placeholder?: string;
  readonly onFilterClick?: () => void;
  readonly showFilters?: boolean;
  readonly onToggleFilters?: () => void;
}

export interface R2MResultsListProps {
  readonly items: SearchItem[];
  readonly onSelect: (item: SearchItem) => void;
  readonly isVisible: boolean;
}
