# Sistema de Graficado de Rutas - Rout2Me

## Resumen Ejecutivo

Este documento explica cómo funciona el sistema de graficado de rutas en la aplicación Rout2Me, la diferencia entre `routes` y `route_variants`, y cómo escalar el sistema.

## Arquitectura del Sistema

### 1. Estructura de Datos

#### Routes vs Route Variants

**Routes (Tabla `routes`)**
- **Propósito**: Información general de la ruta de transporte
- **Campos principales**:
  - `id`: Identificador único
  - `code`: Código de la ruta (ej: "A1", "B2")
  - `name`: Nombre descriptivo (ej: "Centro - Terminal")
  - `active`: Estado de la ruta
  - `created_at`: Fecha de creación

**Route Variants (Tabla `route_variants`)**
- **Propósito**: Variantes específicas de una ruta (ida/vuelta)
- **Campos principales**:
  - `id`: Identificador único de la variante
  - `route_id`: Referencia a la ruta padre
  - `direction`: Dirección ('INBOUND' | 'OUTBOUND')
  - `path`: Array de coordenadas `{lat, lng}[]`
  - `length_m_json`: Longitud en metros

#### Relación entre Routes y Route Variants

```
Route (1) -----> (N) Route Variants
   |                    |
   |-- code: "A1"       |-- direction: "INBOUND"
   |-- name: "Centro"   |-- path: [{lat, lng}, ...]
   |-- active: true     |-- direction: "OUTBOUND"
                        |-- path: [{lat, lng}, ...]
```

### 2. Flujo de Datos

#### 2.1 Obtención de Datos

```typescript
// 1. Se obtienen route_variants desde la API
const apiVariants = await fetch(`${API_REST_URL}/route_variants`);

// 2. Para cada variante, se obtiene la información de la ruta padre
const routesWithVariants = await Promise.all(
  apiVariants.map(async (variant) => {
    const routeInfo = await fetchRouteInfo(variant.route_id);
    return transformApiRouteVariantToRoute(variant, routeInfo);
  })
);
```

#### 2.2 Headers de Autenticación

**Configuración de Headers HTTP**

Todas las peticiones a la API utilizan headers consistentes para autenticación:

```typescript
const headers = {
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
};
```

**Variables de Entorno Requeridas**:
- `VITE_SERVICE_ROLE_KEY`: Clave de servicio para autenticación con Supabase
- `VITE_BACKEND_REST_URL`: URL base de la API REST

**Patrón de Headers en Servicios**:

```typescript
// routeService.ts
const response = await fetch(
  `${API_REST_URL}/route_variants?select=id,route_id,direction,path,length_m_json`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
    },
  },
);

// busService.ts
const response = await fetch(`${API_REST_URL}/buses`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
  },
});
```

**Headers para APIs Externas**:

```typescript
// mapMatchingService.ts - Stadia Maps API
const response = await fetch(
  `https://route.stadiamaps.com/trace_route?api_key=${apiKey}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  },
);
```

**Gestión de Headers en Service Worker**:

```typescript
// public/sw.js - Interceptación de peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Verificar headers de contenido
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return; // Omitir recursos muy grandes
  }
});
```

#### 2.2 Transformación de Datos

```typescript
// Conversión de coordenadas de {lat, lng} a [lng, lat] para MapLibre
const path: [number, number][] = variant.path.map((point) => [
  point.lng,
  point.lat,
]);
```

### 3. Sistema de Graficado

#### 3.1 Hook useRouteDrawing

**Ubicación**: `src/hooks/useRouteDrawing.ts`

**Funcionalidades principales**:
- `addRouteToMap()`: Agrega una ruta al mapa con múltiples capas
- `removeRouteFromMap()`: Elimina una ruta específica
- `clearAllRoutes()`: Limpia todas las rutas
- `fitBoundsToRoute()`: Ajusta la vista del mapa a la ruta
- `highlightRoute()`: Resalta una ruta específica
- `addStopsToMap()`: Agrega paradas al mapa
- `removeStopsFromMap()`: Elimina paradas específicas

#### 3.2 Capas de Renderizado

Cada ruta se renderiza con **4 capas superpuestas**:

1. **Sombra** (`route-shadow-{id}`)
   - Color: Negro
   - Ancho: 12px
   - Opacidad: 0.3
   - Desplazamiento: [2, 2]

2. **Contorno** (`route-outline-{id}`)
   - Color: Blanco
   - Ancho: 10px
   - Opacidad: 1

3. **Línea Principal** (`route-main-{id}`)
   - Color: Azul (#1E56A0)
   - Ancho: 6px
   - Opacidad: 0.9

4. **Brillo** (`route-glow-{id}`)
   - Color: Azul (#1E56A0)
   - Ancho: 8px
   - Opacidad: 0.3
   - Blur: 3px

#### 3.3 Marcadores de Inicio y Fin

```typescript
// Marcadores automáticos en puntos extremos
const startMarker = new maplibregl.Marker({
  color: '#1E56A0',
  scale: 1.2,
}).setLngLat(startPoint);

const endMarker = new maplibregl.Marker({
  color: '#1E56A0', 
  scale: 1.2,
}).setLngLat(endPoint);
```

#### 3.4 Sistema de Paradas

**Características de las Paradas**:
- **Color**: Naranja (#FF6B35) para diferenciarlas de los marcadores de inicio/fin
- **Escala**: 0.8 para ser más discretas que los puntos principales
- **Popup**: Información de la parada con nombre y número de secuencia
- **Gestión**: Limpieza automática al remover rutas

**Uso de Paradas**:

```typescript
// Obtener rutas con paradas
const routesWithStops = await fetchRoutesWithStops();

// Graficar ruta con paradas
const { addRouteToMap } = useRouteDrawing(mapRef);

routesWithStops.forEach(route => {
  if (route.path && route.stops) {
    addRouteToMap(
      route.id,
      route.path,
      { color: route.color },
      route.stops // Paradas de la ruta
    );
  }
});
```

**Estructura de Paradas**:

```typescript
interface Stop {
  id: string;
  name: string;
  created_at: string;
  location: [number, number]; // [lng, lat] para MapLibre
}
```

### 4. Sistema de Animación

#### 4.1 Componente RouteAnimation

**Ubicación**: `src/components/RouteAnimation.tsx`

**Características**:
- Animación progresiva de la ruta
- Interpolación suave entre puntos
- Efecto de "dibujo" en tiempo real
- Color dorado (#FFD700) para la animación

#### 4.2 Algoritmo de Animación

```typescript
// Cálculo del progreso
progressRef.current += 0.02;
const currentPoint = Math.floor(progressRef.current * (totalPoints - 1));

// Interpolación entre puntos
const interpolatedCoord: [number, number] = [
  startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress,
  startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress,
];
```

### 5. Sistema de Caché

#### 5.1 Caché de Tiles

**Ubicación**: `src/hooks/useMapCache.ts`

**Funcionalidades**:
- Precarga de tiles para múltiples niveles de zoom
- Optimización de rendimiento
- Limpieza automática de caché

#### 5.2 Configuración Optimizada

```typescript
const optimizedConfig = {
  maxTileCacheSize: 200,
  refreshExpiredTiles: false,
  fadeDuration: 200,
  crossSourceCollisions: false,
  cacheControl: 'max-age=86400', // 24 horas
};
```

### 6. Map Matching

#### 6.1 Servicio de Map Matching

**Ubicación**: `src/services/mapMatchingService.ts`

**Propósito**: Ajustar rutas dibujadas a la red vial real usando Stadia Maps API

**Características**:
- Algoritmo Valhalla para ajuste a calles
- Modo específico para transporte público (`costing: 'bus'`)
- Codificación/decodificación de polylines
- Simplificación de geometrías con Douglas-Peucker

#### 6.2 Proceso de Map Matching

```typescript
// 1. Configuración para transporte público
const requestBody = {
  shape: points,
  costing: 'bus',
  shape_match: 'map_snap',
  costing_options: {
    bus: {
      use_bus_routes: 1, // Preferir rutas de bus
    },
  },
};

// 2. Llamada a Stadia Maps API
const response = await fetch(
  `https://route.stadiamaps.com/trace_route?api_key=${apiKey}`,
  { method: 'POST', body: JSON.stringify(requestBody) }
);
```

### 7. Gestión de Estado

#### 7.1 Estados de Ruta

```typescript
interface Route {
  status: 'active' | 'offline';
  activeBuses?: number;
  nextBus?: number;
  isFavorite?: boolean;
}
```

#### 7.2 Filtros y Búsqueda

**Ubicación**: `src/pages/RoutesPage.tsx`

**Filtros disponibles**:
- Todas las rutas
- Rutas favoritas
- Rutas recientes
- Búsqueda por texto

### 8. Optimizaciones de Rendimiento

#### 8.1 Gestión de Memoria

- Limpieza automática de capas y fuentes
- Referencias débiles para marcadores
- Timeout para precarga de tiles

#### 8.2 Lazy Loading

```typescript
// Precarga diferida de tiles
preloadTimeoutRef.current = setTimeout(async () => {
  await mapTileCacheService.preloadTiles(newCenter, zoom, 2);
}, 500);
```

### 9. Escalabilidad y Mejoras Futuras

#### 9.1 Optimizaciones Recomendadas

1. **Clustering de Rutas**
   - Agrupar rutas cercanas en zoom bajo
   - Mostrar detalle individual en zoom alto

2. **Virtualización de Rutas**
   - Renderizar solo rutas visibles
   - Lazy loading de geometrías complejas

3. **Compresión de Datos**
   - Usar polylines codificados para almacenamiento
   - Simplificación de geometrías con tolerancia adaptativa

4. **Caché Inteligente**
   - Caché basado en patrones de uso
   - Prefetching predictivo de rutas

#### 9.2 Arquitectura de Microservicios

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Route Service │    │  Map Service    │    │ Cache Service   │
│                 │    │                 │    │                 │
│ - CRUD Routes   │    │ - Tile Cache    │    │ - Redis Cache  │
│ - Variants      │    │ - Route Cache   │    │ - Session Mgmt │
│ - Metadata      │    │ - Map Matching  │    │ - Prefetching  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 9.3 Base de Datos Optimizada

```sql
-- Índices recomendados
CREATE INDEX idx_route_variants_route_id ON route_variants(route_id);
CREATE INDEX idx_route_variants_direction ON route_variants(direction);
CREATE INDEX idx_routes_active ON routes(active);

-- Particionado por región geográfica
CREATE TABLE route_variants_region_1 PARTITION OF route_variants
FOR VALUES IN ('region_1');
```

### 10. Monitoreo y Métricas

#### 10.1 KPIs del Sistema

- **Rendimiento**: Tiempo de carga de rutas
- **Precisión**: Calidad del map matching
- **Uso**: Rutas más consultadas
- **Caché**: Hit rate del sistema de caché

#### 10.2 Alertas Recomendadas

- Tiempo de respuesta > 2s
- Error rate > 5%
- Uso de memoria > 80%
- Tiles faltantes > 10%

### 11. Guía de Implementación

#### 11.1 Agregar Nueva Ruta con Paradas

```typescript
// 1. Crear ruta en la base de datos
const newRoute = await createRoute({
  code: 'C3',
  name: 'Nueva Ruta',
  active: true
});

// 2. Crear variantes
const variant = await createRouteVariant({
  route_id: newRoute.id,
  direction: 'INBOUND',
  path: coordinates
});

// 3. Crear paradas
const stops = await Promise.all([
  createStop({
    name: 'Parada Centro',
    location_json: { lat: 5.0703, lng: -75.5138 }
  }),
  createStop({
    name: 'Parada Terminal',
    location_json: { lat: 5.0803, lng: -75.5238 }
  })
]);

// 4. Asociar paradas con la variante
await Promise.all(
  stops.map(stop => 
    createRouteVariantStop({
      variant_id: variant.id,
      stop_id: stop.id
    })
  )
);
```

#### 11.2 Modificar Ruta Existente

```typescript
// 1. Actualizar información de la ruta
await updateRoute(routeId, {
  name: 'Nombre Actualizado',
  active: true
});

// 2. Actualizar geometría de variantes
await updateRouteVariant(variantId, {
  path: newCoordinates
});
```

#### 11.3 Mejores Prácticas para Headers

**Configuración Centralizada de Headers**:

```typescript
// utils/apiHeaders.ts
export const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
});

// Uso en servicios
const response = await fetch(url, {
  method: 'GET',
  headers: getApiHeaders(),
});
```

**Validación de Headers**:

```typescript
// utils/validateHeaders.ts
export const validateApiHeaders = () => {
  const requiredEnvVars = [
    'VITE_SERVICE_ROLE_KEY',
    'VITE_BACKEND_REST_URL'
  ];
  
  const missing = requiredEnvVars.filter(
    envVar => !import.meta.env[envVar]
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};
```

**Manejo de Errores de Headers**:

```typescript
// services/errorHandler.ts
export const handleApiError = (error: any, context: string) => {
  if (error.status === 401) {
    console.error(`${context}: Authentication failed - check API key`);
    throw new Error('Error de autenticación: Verificar clave de API');
  }
  
  if (error.status === 403) {
    console.error(`${context}: Forbidden - check permissions`);
    throw new Error('Error de permisos: Verificar permisos de API');
  }
  
  console.error(`${context}: ${error.message}`);
  throw error;
};
```

**Headers para Diferentes Tipos de Peticiones**:

```typescript
// GET requests
const getHeaders = () => ({
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
});

// POST requests
const postHeaders = () => ({
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
  'Accept': 'application/json',
});

// External API requests (Stadia Maps)
const externalApiHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Rout2Me/1.0',
});
```

### 12. Troubleshooting

#### 12.1 Problemas Comunes

**Rutas no se muestran**:
- Verificar conexión a API
- Revisar formato de coordenadas
- Comprobar permisos de API key
- **Verificar headers de autenticación**: Asegurar que `VITE_SERVICE_ROLE_KEY` esté configurado

**Errores de Autenticación (401/403)**:
- Verificar que `VITE_SERVICE_ROLE_KEY` esté en el archivo `.env`
- Comprobar que la clave tenga permisos de `service_role`
- Verificar que la URL de la API sea correcta
- Revisar que los headers incluyan tanto `apikey` como `Authorization`

**Headers Incorrectos**:
```typescript
// ❌ Incorrecto - falta Authorization
headers: {
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
}

// ✅ Correcto - headers completos
headers: {
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`,
}
```

**Rendimiento lento**:
- Limpiar caché de tiles
- Reducir número de rutas simultáneas
- Optimizar geometrías

**Map matching falla**:
- Verificar API key de Stadia Maps
- Comprobar formato de puntos
- Revisar límites de API
- **Verificar headers de Content-Type**: Asegurar que sea `application/json`

### 13. Conclusión

El sistema de graficado de rutas en Rout2Me está diseñado para ser escalable, eficiente y fácil de mantener. La separación clara entre `routes` y `route_variants` permite flexibilidad en la gestión de diferentes direcciones de una misma ruta, mientras que el sistema de caché y optimizaciones garantiza un rendimiento óptimo.

Para escalar el sistema, se recomienda implementar las optimizaciones mencionadas y considerar una arquitectura de microservicios para separar responsabilidades y mejorar la mantenibilidad.
