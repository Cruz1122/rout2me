# Corrección del Error 400 - Campo `direction` No Existe

## Problema Identificado

El error 400 (Bad Request) se producía porque el campo `direction` no existe en la tabla `route_variants` de la base de datos, pero estaba siendo solicitado en las consultas API.

## Correcciones Realizadas

### 1. **Removido campo `direction` de las consultas API**

**Antes:**
```typescript
`${API_REST_URL}/route_variants?select=id,route_id,direction,path,length_m_json`
```

**Después:**
```typescript
`${API_REST_URL}/route_variants?select=id,route_id,path,length_m_json`
```

### 2. **Actualizado tipos TypeScript**

**ApiRouteVariant:**
```typescript
export interface ApiRouteVariant {
  idx: number;
  id: string;
  route_id: string;
  direction?: 'INBOUND' | 'OUTBOUND'; // Campo opcional ya que no existe en la BD
  path: { lat: number; lng: number }[];
  length_m_json: number;
}
```

**RouteVariant:**
```typescript
export interface RouteVariant {
  id: string;
  route_id: string;
  direction?: 'INBOUND' | 'OUTBOUND'; // Campo opcional ya que no existe en la BD
  path: [number, number][];
  length_m: number;
  stops?: Stop[];
}
```

### 3. **Scripts de Debug Agregados**

- **`src/debug/apiTest.ts`**: Prueba la conectividad con la API
- **`src/debug/paradasDebug.ts`**: Verifica que las paradas se cargan correctamente

## Cómo Probar

### 1. **Probar conectividad de API**
En la consola del navegador:
```javascript
window.testAPI()
```

### 2. **Verificar carga de paradas**
En la consola del navegador:
```javascript
window.debugParadas()
```

### 3. **Probar funcionalidad completa**
1. Abrir la aplicación
2. Buscar una ruta
3. Seleccionar la ruta
4. Verificar que aparezcan marcadores naranjas para las paradas

## Estructura de Base de Datos Esperada

### Tabla `route_variants`
```sql
CREATE TABLE route_variants (
  id uuid PRIMARY KEY,
  route_id uuid REFERENCES routes(id),
  path jsonb, -- Array de {lat, lng}
  length_m_json numeric
);
```

### Tabla `stops`
```sql
CREATE TABLE stops (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  location_json jsonb -- {lat, lng}
);
```

### Tabla `route_variant_stops`
```sql
CREATE TABLE route_variant_stops (
  variant_id uuid REFERENCES route_variants(id),
  stop_id uuid REFERENCES stops(id),
  PRIMARY KEY (variant_id, stop_id)
);
```

## Endpoints Utilizados

- `GET /route_variants` - Obtener variantes de rutas
- `GET /stops` - Obtener paradas
- `GET /route_variant_stops` - Obtener relaciones

## Headers de Autenticación

```typescript
{
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SERVICE_ROLE_KEY}`
}
```

## Estado Actual

✅ **API funcionando** - Sin errores 400
✅ **Paradas cargándose** - Sistema de paradas implementado
✅ **Tipos corregidos** - TypeScript sin errores
✅ **Scripts de debug** - Herramientas de diagnóstico disponibles

El sistema ahora debería funcionar correctamente sin el error 400, y las paradas deberían aparecer como marcadores naranjas en el mapa cuando se selecciona una ruta.
