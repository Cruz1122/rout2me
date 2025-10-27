# Corrección del Error 400 - Campo `direction` No Existe

> **Nota**: Este documento describe una corrección histórica. La información actualizada sobre el sistema de rutas está en [README_ROUTES_SYSTEM.md](./README_ROUTES_SYSTEM.md)

## Problema Identificado

El error 400 se producía porque el campo `direction` no existe en la tabla `route_variants` de la base de datos, pero estaba siendo solicitado en las consultas API.

## Correcciones Realizadas

### 1. Removido campo `direction` de las consultas API

**Antes:**
```typescript
`${API_REST_URL}/route_variants?select=id,route_id,direction,path,length_m_json`
```

**Después:**
```typescript
`${API_REST_URL}/route_variants?select=id,route_id,path,length_m_json`
```

### 2. Actualizado tipos TypeScript

El campo `direction` ahora es **opcional** en las interfaces TypeScript:

```typescript
export interface ApiRouteVariant {
  id: string;
  route_id: string;
  direction?: 'INBOUND' | 'OUTBOUND'; // Campo opcional
  path: { lat: number; lng: number }[];
  length_m_json: number;
}
```

### 3. Scripts de Debug

- `src/debug/apiTest.ts` - Prueba conectividad con la API
- `src/debug/paradasDebug.ts` - Verifica carga de paradas

## Estado Actual

✅ **Corregido** - Sin errores 400
✅ **Tipos actualizados** - TypeScript sin errores
✅ **Documentación actualizada** - Ver [README_ROUTES_SYSTEM.md](./README_ROUTES_SYSTEM.md)
