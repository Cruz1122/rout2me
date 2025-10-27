# Documentación Técnica - Rout2Me

Este directorio contiene toda la documentación técnica del proyecto Rout2Me.

## Índice de Documentación

### 🗺️ [Sistema de Rutas y Paradas](./README_ROUTES_SYSTEM.md)
Documentación completa sobre el sistema de graficado de rutas, incluyendo:
- Arquitectura del sistema de rutas y variantes
- Sistema de paradas y su integración
- Flujo de datos y transformación de coordenadas
- Graficado de rutas con MapLibre
- Optimizaciones y escalabilidad

**Archivos relacionados:**
- `src/services/routeService.ts`
- `src/hooks/useRouteDrawing.ts`
- `src/components/RouteAnimation.tsx`

### 🚀 [Sistema de Caché](./CACHE_SYSTEM.md)
Documentación del sistema de caché implementado para mejorar el rendimiento:
- Servicios de caché (imágenes, tiles, etc.)
- Estrategias de caché
- Service Worker
- Optimizaciones para conexiones lentas
- Gestión y limpieza automática

**Archivos relacionados:**
- `src/services/cacheService.ts`
- `src/services/imageCacheService.ts`
- `src/services/mapTileCacheService.ts`
- `src/hooks/useCache.ts`
- `src/components/CacheManager.tsx`

### 🔧 [Corrección de API](./CORRECCION_API.md)
Documentación sobre la corrección del error 400 relacionado con el campo `direction`:
- Problema identificado
- Correcciones realizadas
- Actualización de tipos TypeScript
- Scripts de debug agregados
- Estructura de base de datos esperada

**Archivos relacionados:**
- `src/debug/apiTest.ts`
- `src/debug/paradasDebug.ts`
- `src/services/routeService.ts`

### 📍 [Implementación de Paradas](./IMPLEMENTACION_PARADAS.md)
Documentación sobre la implementación del sistema de paradas:
- Nuevos tipos TypeScript
- Servicios de API para paradas
- Actualización del hook useRouteDrawing
- Estructura de base de datos
- Uso del sistema
- Consideraciones de rendimiento

**Archivos relacionados:**
- `src/services/routeService.ts`
- `src/hooks/useRouteDrawing.ts`

## Estructura del Proyecto

```
src/
├── services/          # Servicios de negocio
├── hooks/            # Hooks personalizados de React
├── components/       # Componentes UI reutilizables
├── pages/            # Páginas principales
├── types/            # Definiciones de tipos TypeScript
├── utils/            # Utilidades y helpers
├── config/           # Configuración
├── data/             # Datos mock
└── docs/             # 📚 Documentación técnica (este directorio)
```

## Guías de Desarrollo

Para contribuir al proyecto, consulta:

1. **[README principal](../README.md)** - Información general del proyecto
2. **[Sistema de Rutas](./README_ROUTES_SYSTEM.md)** - Cómo funciona el sistema de rutas
3. **[Sistema de Caché](./CACHE_SYSTEM.md)** - Optimizaciones de rendimiento

## Recursos Adicionales

- **Repositorio**: https://github.com/Cruz1122/rout2me
- **Documentación de Ionic**: https://ionicframework.com/docs
- **MapLibre GL JS**: https://maplibre.org/maplibre-gl-js-docs/
- **React**: https://react.dev/

## Contacto

Para preguntas sobre la documentación técnica, contacta al equipo de desarrollo o crea un issue en el repositorio.
