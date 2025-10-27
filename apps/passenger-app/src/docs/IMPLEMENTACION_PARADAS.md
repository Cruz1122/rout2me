# Implementación del Sistema de Paradas - Rout2Me

> **Nota**: La documentación completa del sistema de rutas y paradas está en [README_ROUTES_SYSTEM.md](./README_ROUTES_SYSTEM.md). Este documento describe la implementación específica de las paradas.

## Resumen

Se implementó el sistema de paradas para las route variants en Rout2Me. Las paradas se muestran como marcadores naranjas en el mapa cuando se selecciona una ruta.

## Tipos Principales

```typescript
export interface Stop {
  id: string;
  name: string;
  location: [number, number]; // [lng, lat] para MapLibre
}

export interface RouteVariantStop {
  variant_id: string;
  stop_id: string;
  stop: Stop;
}
```

## Funciones Principales

### API
- `fetchStops()` - Obtiene todas las paradas
- `fetchStopsForVariant(variantId)` - Paradas de una variante específica
- `fetchRoutesWithStops()` - Rutas con paradas incluidas

### Map Drawing
- `addStopsToMap(routeId, stops)` - Agrega paradas al mapa
- `removeStopsFromMap(routeId)` - Elimina paradas del mapa

## Características Visuales

- **Color**: Naranja (#FF6B35)
- **Escala**: 0.8
- **Popup**: Información de la parada
- **Limpieza**: Automática al remover rutas

## Estructura de Base de Datos

```sql
-- Tabla de paradas
CREATE TABLE stops (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  location_json jsonb -- {lat, lng}
);

-- Tabla de relación
CREATE TABLE route_variant_stops (
  variant_id uuid REFERENCES route_variants(id),
  stop_id uuid REFERENCES stops(id),
  PRIMARY KEY (variant_id, stop_id)
);
```

## Uso Básico

```typescript
import { fetchRoutesWithStops } from '../services/routeService';
import { useRouteDrawing } from '../hooks/useRouteDrawing';

// Cargar rutas con paradas
const routes = await fetchRoutesWithStops();

// Graficar ruta con paradas
const { addRouteToMap } = useRouteDrawing(mapRef);
addRouteToMap(
  route.id,
  route.path,
  { color: route.color },
  route.stops // Paradas de la ruta
);
```

## Archivos Relacionados

- `src/services/routeService.ts` - Servicios de API
- `src/hooks/useRouteDrawing.ts` - Lógica de graficado

Para más información, consulta [README_ROUTES_SYSTEM.md](./README_ROUTES_SYSTEM.md).
