# Sistema de Caché para Rout2Me

Este documento explica el sistema de caché implementado para mejorar el rendimiento de la aplicación, especialmente en conexiones lentas.

## Arquitectura del Sistema

El sistema de caché está compuesto por varios servicios especializados:

### 1. Servicios Principales

- **`cacheService.ts`**: Servicio base que maneja IndexedDB
- **`imageCacheService.ts`**: Caché especializado para imágenes
- **`mapTileCacheService.ts`**: Caché para tiles de mapas
- **`assetPreloader.ts`**: Precarga de assets críticos
- **`cacheStrategyService.ts`**: Estrategias de caché
- **`cacheCleanupService.ts`**: Limpieza automática
- **`serviceWorkerService.ts`**: Gestión del Service Worker

### 2. Hooks de React

- **`useCache.ts`**: Hook principal para gestionar caché
- **`useMapCache.ts`**: Hook especializado para mapas

### 3. Componentes UI

- **`CacheManager.tsx`**: Interfaz para gestionar el caché

## Características Principales

### 🚀 Rendimiento Optimizado
- **Caché en memoria**: Para acceso rápido a recursos frecuentes
- **Caché en disco**: Para persistencia entre sesiones
- **Compresión de imágenes**: Reducción automática de tamaño
- **Precarga inteligente**: Carga proactiva de recursos críticos

### 🔄 Estrategias de Caché
- **Cache First**: Para recursos estáticos (CSS, JS, imágenes)
- **Network First**: Para datos dinámicos (APIs)
- **Stale While Revalidate**: Para imágenes y tiles
- **Cache Only**: Para recursos críticos offline

### 🧹 Limpieza Automática
- **Limpieza por tiempo**: Elimina elementos expirados
- **Limpieza por tamaño**: Libera espacio cuando es necesario
- **Limpieza por uso**: Elimina elementos menos utilizados

### 📱 Service Worker
- **Caché offline**: Funcionalidad sin conexión
- **Actualizaciones automáticas**: Mantiene el caché actualizado
- **Estrategias inteligentes**: Diferentes estrategias por tipo de recurso

## Uso en Componentes

### Hook useCache

```typescript
import { useCache } from '../hooks/useCache';

function MyComponent() {
  const {
    stats,
    isLoading,
    loadImage,
    preloadImages,
    clearCache,
    runCleanup
  } = useCache();

  // Cargar una imagen con caché
  const handleLoadImage = async () => {
    try {
      const imageUrl = await loadImage('https://example.com/image.jpg', {
        maxWidth: 800,
        quality: 0.8,
        format: 'webp'
      });
      // Usar la imagen...
    } catch (error) {
      console.error('Error al cargar imagen:', error);
    }
  };

  return (
    <div>
      {isLoading && <p>Cargando...</p>}
      {stats && (
        <p>Tamaño del caché: {formatBytes(stats.totalSize)}</p>
      )}
    </div>
  );
}
```

### Hook useMapCache

```typescript
import { useMapCache } from '../hooks/useMapCache';

function MapComponent() {
  const {
    preloadOnMove,
    getOptimizedMapConfig,
    getTileCacheStats
  } = useMapCache({
    center: [-75.5138, 5.0703],
    zoom: 15,
    preloadRadius: 2
  });

  // Configuración optimizada para el mapa
  const mapConfig = getOptimizedMapConfig();

  // Precargar tiles cuando el mapa se mueve
  const handleMapMove = (newCenter, newZoom) => {
    preloadOnMove(newCenter, newZoom);
  };

  return (
    <div>
      {/* Renderizar mapa con configuración optimizada */}
    </div>
  );
}
```

## Configuración

### Configuración por Defecto

```typescript
// Tamaño máximo del caché: 100MB
// Tiempo de expiración: 30 días
// Limpieza automática: Cada 24 horas
// Estrategia por defecto: Cache First
```

### Personalización

```typescript
import { cacheService } from './services/cacheService';
import { cacheCleanupService } from './services/cacheCleanupService';

// Configurar tamaño máximo
cacheService.config.maxSize = 200 * 1024 * 1024; // 200MB

// Configurar tiempo de expiración
cacheService.config.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días

// Configurar limpieza automática
cacheCleanupService.updateConfig({
  autoCleanup: true,
  cleanupInterval: 12 * 60 * 60 * 1000, // 12 horas
  maxCacheSize: 150 * 1024 * 1024, // 150MB
  cleanupThreshold: 0.8 // 80% de uso
});
```

## Gestión del Caché

### Interfaz de Usuario

El componente `CacheManager` proporciona una interfaz completa para:

- **Ver estadísticas**: Tamaño, número de elementos, tipos de caché
- **Limpiar caché**: Por tipo o completamente
- **Ejecutar limpieza**: Limpieza automática manual
- **Gestionar Service Worker**: Registrar, actualizar, verificar estado

### Acceso Programático

```typescript
import { cacheService } from './services/cacheService';
import { imageCacheService } from './services/imageCacheService';
import { mapTileCacheService } from './services/mapTileCacheService';

// Obtener estadísticas
const stats = await cacheService.getStats();

// Limpiar caché específico
await imageCacheService.clearMemoryCache();
await mapTileCacheService.clearTileCache();

// Limpiar todo
await cacheService.clear();
```

## Optimizaciones Específicas

### Para Mapas
- **Precarga de tiles**: Carga proactiva de tiles adyacentes
- **Múltiples fuentes**: Balanceo de carga entre servidores
- **Compresión**: Tiles optimizados para menor tamaño
- **Caché persistente**: Tiles se mantienen entre sesiones

### Para Imágenes
- **Compresión automática**: Reducción de tamaño sin pérdida de calidad
- **Formatos optimizados**: Conversión a WebP cuando es posible
- **Redimensionamiento**: Ajuste automático de dimensiones
- **Caché en memoria**: Para acceso instantáneo

### Para Conexiones Lentas
- **Precarga inteligente**: Solo recursos críticos
- **Estrategias adaptativas**: Cambio de estrategia según velocidad
- **Compresión agresiva**: Máxima reducción de tamaño
- **Caché persistente**: Máxima duración de elementos

## Monitoreo y Debugging

### Estadísticas Disponibles

```typescript
const stats = await cacheService.getStats();
console.log({
  totalSize: stats.totalSize,        // Tamaño total en bytes
  itemCount: stats.itemCount,        // Número de elementos
  oldestItem: stats.oldestItem,      // Timestamp del elemento más antiguo
  newestItem: stats.newestItem       // Timestamp del elemento más nuevo
});
```

### Logs de Debug

El sistema incluye logs detallados para debugging:

```typescript
// Habilitar logs detallados
localStorage.setItem('debug-cache', 'true');

// Los logs aparecerán en la consola con prefijo [Cache]
```

## Mejores Prácticas

### 1. Configuración Inicial
- Inicializar servicios al inicio de la aplicación
- Configurar límites apropiados según el dispositivo
- Habilitar limpieza automática

### 2. Uso de Recursos
- Usar `loadImage` para imágenes con optimización automática
- Precargar recursos críticos al inicio
- Limpiar recursos no utilizados regularmente

### 3. Monitoreo
- Revisar estadísticas periódicamente
- Ajustar configuración según el uso
- Limpiar caché cuando sea necesario

### 4. Optimización
- Usar formatos de imagen apropiados
- Configurar tamaños máximos según el caso de uso
- Ajustar estrategias según el tipo de contenido

## Troubleshooting

### Problemas Comunes

1. **Caché lleno**: Aumentar `maxSize` o ejecutar limpieza
2. **Elementos expirados**: Ajustar `maxAge` o ejecutar limpieza
3. **Service Worker no funciona**: Verificar soporte del navegador
4. **Imágenes no se cargan**: Verificar URLs y permisos CORS

### Soluciones

1. **Limpiar caché**: Usar `clearCache()` o interfaz de usuario
2. **Reiniciar servicios**: Recargar la página
3. **Verificar configuración**: Revisar límites y estrategias
4. **Debugging**: Habilitar logs y revisar consola

## Conclusión

El sistema de caché de Rout2Me está diseñado para proporcionar una experiencia de usuario fluida, especialmente en conexiones lentas. Con múltiples estrategias de caché, limpieza automática y optimizaciones específicas, la aplicación puede funcionar eficientemente en una amplia gama de condiciones de red.

Para más información o soporte, consulta la documentación de cada servicio individual o contacta al equipo de desarrollo.
