# Rout2Me - Aplicación para Pasajeros

Una aplicación web moderna de transporte público desarrollada para Manizales, Colombia. Esta aplicación web móvil ayuda a los usuarios a encontrar rutas de autobús, paradas y información de transporte en tiempo real.

**Backend futuro:** El backend será BaaS con Supabase (Postgres, Auth, Storage, Realtime, Functions). Actualmente solo hay datos mock, pero la arquitectura y scripts ya están preparados para integración con Supabase.

## Stack Tecnológico

- **Framework Frontend**: React 19
- **Lenguaje**: TypeScript 5
- **Framework Móvil**: Ionic Framework 8
- **Herramienta de Build**: Vite 6
- **Estilos**: Tailwind CSS 3
- **Mapas**: MapLibre GL JS con tiles de OpenStreetMap
- **Motor de Búsqueda**: Fuse.js para búsqueda difusa
- **Iconos**: Remix Icons (react-icons/ri)
- **Gestor de Paquetes**: pnpm

## Estado Actual del Proyecto

### Funcionalidades Implementadas y Funcionando
- **Mapa Interactivo**: Mapa de pantalla completa con controles personalizados
  - Botones de zoom in/out
  - Brújula interactiva con funcionalidad de arrastrar para rotar
  - Botón de mi ubicación con geolocalización
  - Diseño glassmorphism personalizado
- **Sistema de Búsqueda Avanzado**: Búsqueda completa con filtros
  - Búsqueda difusa en tiempo real usando Fuse.js
  - Búsqueda con debounce (300ms)
  - Filtro por tipo (todos, paradas, rutas)
  - Barra de búsqueda expandible con animaciones suaves
  - Soporte para navegación con teclado
- **Resultados de Búsqueda**: Visualización limpia y responsiva
  - Iconos y colores específicos por tipo
  - Tarjetas de información deslizables para cerrar
  - Soporte para interacción táctil y mouse
- **Navegación**: Navegación basada en pestañas con iconos animados
- **Diseño Responsivo**: Mobile-first con UI glassmorphism

### Páginas con Solo Placeholder (No Funcionales)
- **Gestión de Rutas**: Solo muestra "Funcionalidad en desarrollo"
- **Seguimiento en Vivo**: Solo muestra "Funcionalidad en desarrollo"  
- **Alertas y Notificaciones**: Solo muestra "Funcionalidad en desarrollo"
- **Perfil de Usuario**: Solo muestra "Funcionalidad en desarrollo"

### Datos Actuales
- **Fuente de Datos**: Datos mock estáticos (no hay backend real, pero la integración con Supabase está planificada)
- **Ubicación**: Centrado en Manizales con ~10 paradas ficticias y 6 buses con coordenadas reales
- **Rutas**: Datos de ejemplo, no conectado a sistema real de transporte

## Estructura del Proyecto

```
src/
├── app/                      # Composición de la app
│   └── providers/            # Providers/contextos globales
├── features/
│   ├── auth/                 # Dominio: autenticación
│   │   ├── hooks/            # p.ej. useAuth
│   │   ├── pages/            # LoginPage, RegisterPage, TwoFAPage
│   │   └── services/         # authService y adaptadores
│   ├── routes/               # Dominio: rutas y mapa
│   │   ├── components/       # R2MSearchBar, R2MResultsList, MapInfoCard, etc.
│   │   ├── hooks/            # useRouteDrawing, useSearch, useBusMapping
│   │   ├── pages/            # RoutesPage, LivePage
│   │   └── services/         # routeService, busService, mapMatchingService, mapTileCacheService
│   ├── system/               # Dominio: sistema/infra UI
│   │   ├── components/       # ErrorNotification, GlobalLoader, etc.
│   │   ├── hooks/            # useUserLocation, useLocationPermission, etc.
│   │   ├── pages/            # HomePage, AlertsPage, WelcomePage, LocationPermissionPage
│   │   └── services/         # assetPreloader, serviceWorkerService
│   └── user/                 # Dominio: perfil/usuario
│       └── pages/            # ProfilePage
├── shared/                   # Reutilizable y agnóstico de dominio
│   ├── components/           # R2MButton, R2MInput, R2MLoader, etc.
│   ├── hooks/                # useDebounce, useMapResize, useCache, etc.
│   ├── services/             # cacheService, imageCacheService, etc.
│   ├── types/                # search.ts, etc.
│   └── utils/                # distanceUtils, etc.
├── components/               # (Temporal) otros que no encajen aún
│   └── RouteGuard.tsx
├── data/                     # Datos mock y constantes
│   └── mocks.ts
├── theme/                    # Sistema de estilos y diseño
│   ├── variables.css
│   ├── tabs.css
│   └── search.css
└── docs/                     # Documentación interna
```

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- pnpm (recomendado) o npm

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/Cruz1122/rout2me
cd rout2me/apps/passenger-app

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

### Scripts Disponibles
```bash
# Desarrollo
pnpm dev          # Iniciar servidor de desarrollo con HMR
pnpm build        # Build para producción
pnpm preview      # Vista previa del build localmente
pnpm lint         # Ejecutar ESLint
```

## Configuración

### Variables de Entorno

#### Map Matching (Opcional pero Recomendado)

El proyecto incluye **Map Matching** para ajustar las rutas dibujadas a las calles reales usando **Stadia Maps API**:

**Sin API Key (Modo Actual):**
- ✅ El mapa funciona normalmente
- ⚠️ Las rutas se muestran como líneas directas entre puntos
- ⚠️ **NO se ajustan a las calles reales**

**Con API Key (Recomendado):**
- ✅ Las rutas se ajustan automáticamente a calles reales
- ✅ Respeta sentidos de vías y geometría vial
- ✅ Proporciona distancias y duraciones precisas

**Configuración:**

1. **Obtener API Key gratuita:**
   - Ve a: https://client.stadiamaps.com/signup/
   - Crea una cuenta (plan gratuito disponible)
   - Copia tu API key

2. **Crear archivo `.env` en la raíz del proyecto:**
   ```bash
   # .env
   VITE_STADIA_API_KEY=tu_api_key_aquí
   ```

3. **Reiniciar el servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

**Verificación:**
- Selecciona una ruta en el mapa
- Si el map matching está activo, verás que las rutas se ajustan automáticamente a las calles
- Sin API key, las rutas se dibujan como líneas rectas entre puntos

**Parámetros de Map Matching (en `src/features/routes/services/mapMatchingService.ts`):**
```typescript
costing: 'bus'                // Modo de transporte (bus/auto/pedestrian)
shape_match: 'map_snap'       // Algoritmo de ajuste a calles
costing_options: {
  bus: {
    use_bus_routes: 1         // Preferir rutas de bus
  }
}
```

#### Otras Variables (Futuras)

Para futuros proveedores de mapas que requieran autenticación:
```env
VITE_MAP_STYLE_URL=<url-del-estilo-del-mapa>
VITE_MAP_ACCESS_TOKEN=<token-de-acceso>
```

### Variables Globales CSS (REALES Y EN USO)
**Estas son las variables CSS que realmente existen y se usan en el proyecto:**

```css
/* src/theme/variables.css */
:root {
  --color-primary: #163172;           /* Azul oscuro principal */
  --color-secondary: #1E56A0;         /* Azul medio secundario */
  --color-bg: #F6F6F6;               /* Fondo gris claro */
  --color-surface: #D6E4F0;          /* Superficie azul claro */
  --color-text: #163172;             /* Texto azul oscuro */
  --color-accent: #1E56A0;           /* Acento azul medio */
  
  /* Versiones RGB para efectos de transparencia */
  --color-primary-rgb: 22, 49, 114;   /* #163172 en RGB */
  --color-secondary-rgb: 30, 86, 160; /* #1E56A0 en RGB */
  --color-bg-rgb: 246, 246, 246;      /* #F6F6F6 en RGB */
  --color-surface-rgb: 214, 228, 240; /* #D6E4F0 en RGB */
  --color-text-rgb: 22, 49, 114;      /* #163172 en RGB */
  
  /* Variables de Ionic */
  --ion-color-primary: var(--color-primary);
  --ion-color-secondary: var(--color-secondary);
}
```

### Configuración del Mapa
- **Centro por Defecto**: Manizales, Colombia (-75.5138, 5.0703)
- **Zoom por Defecto**: 15
- **Fuente de Tiles**: OpenStreetMap (gratuito, sin API key)
- **Controles de Navegación**: Botones personalizados (posicionados abajo-izquierda)

## Estructura de Datos (Mock - No Real)

**IMPORTANTE: Todos los datos son ficticios y están hardcodeados en `src/data/mocks.ts`**

### Interfaz Stop (Parada)
```typescript
interface Stop {
  id: string;          // Ejemplo: 'stop-1'
  name: string;        // Ejemplo: 'Universidad de Caldas'
  code: string;        // Ejemplo: 'UC001'
  tags: string[];      // Ejemplo: ['universidad', 'caldas', 'educación']
  type: 'stop';
  lat: number;         // Ejemplo: 5.0556 (Universidad de Caldas real)
  lng: number;         // Ejemplo: -75.4934 (Universidad de Caldas real)
  routes: string[];    // Ejemplo: ['R102', 'R401'] - RUTAS FICTICIAS
}
```

### Interfaz Route (Ruta)
```typescript
interface Route {
  id: string;          // Ejemplo: 'route-1' 
  name: string;        // Ejemplo: 'Ruta Centro-Universidad'
  code: string;        // Ejemplo: 'R101'
  tags: string[];      // Ejemplo: ['centro', 'universidad']
  type: 'route';
  stops: string[];     // IDs de paradas - CONEXIONES FICTICIAS
  fare: number;        // Ejemplo: 2500 (pesos colombianos)
}
```

## Configuración de Búsqueda

### Configuración de Fuse.js (Motor de Búsqueda)
```typescript
{
  threshold: 0.35,        // Sensibilidad de búsqueda (0=exacta, 1=cualquier cosa)
  keys: [                 // Campos donde buscar
    'name',               // Nombre de parada/ruta
    'code',               // Código (ej: UC001, R101)
    'tags',               // Etiquetas descriptivas
    'type'                // Tipo: 'stop' o 'route'
  ]
}
```

### Características de Búsqueda Implementadas
- **Input con Debounce**: Retraso de 300ms para evitar búsquedas excesivas
- **Consulta Mínima**: 2 caracteres mínimo
- **Tipos de Filtro**: Todos, Paradas, Rutas
- **Navegación por Teclado**: Flechas + Enter para seleccionar
- **Funcionalidad de Limpieza**: Botón X y tecla Escape

### Datos Mock Actuales
- **Paradas**: ~9 ubicaciones en Manizales (Universidad de Caldas, Hospital, Centro Comercial, etc.)
- **Rutas**: ~6 rutas ficticias con tarifas entre $2500-$3500
- **Ubicaciones Reales**: Solo las coordenadas de lugares son reales, las conexiones son inventadas

## Diseño UI/UX

### Sistema de Diseño
- **Color Primario**: #163172 (azul oscuro)
- **Color Secundario**: #1E56A0 (azul medio)
- **Color de Fondo**: #F6F6F6 (gris claro)
- **Color de Superficie**: #D6E4F0 (azul muy claro)
- **Color de Texto**: #163172 (azul oscuro)
- **Color de Acento**: #1E56A0 (azul medio)
- **Patrón de Diseño**: Glassmorphism (cristal esmerilado)
- **Tipografía**: Fuentes del sistema con escala de tamaños
- **Espaciado**: Escala de espaciado de Tailwind CSS

### Breakpoints Responsivos
- **Móvil**: < 768px (objetivo principal)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Accesibilidad
- Etiquetas ARIA en elementos interactivos
- Soporte para navegación por teclado
- Objetivos táctiles amigables (mínimo 44px)
- Ratios de contraste alto para texto

## Guías de Desarrollo

### Estilo de Código
- **Nomenclatura**: PascalCase para componentes, camelCase para variables
- **Imports**: Imports absolutos con mapeo de rutas
- **TypeScript**: Modo estricto habilitado
- **Formateo**: Prettier con integración ESLint

### Patrones de Componentes
- Componentes funcionales con hooks
- Hooks personalizados para lógica compartida
- Interfaces de props para todos los componentes
- Patrones de callback para comunicación padre-hijo

### Consideraciones de Rendimiento Implementadas
- **React.memo**: Para componentes costosos de re-renderizar
- **useCallback**: Para referencias estables de funciones
- **useMemo**: Para cálculos costosos
- **Búsqueda con debounce**: Para reducir búsquedas excesivas (no hay API real, pero está implementado)
- **Carga perezosa**: NO implementada aún

## Testing

**ESTADO ACTUAL: NO HAY TESTS IMPLEMENTADOS**

### Configuración de Tests (Planificada, NO implementada)
```bash
# Scripts que NO existen aún
pnpm test         # NO FUNCIONA - no hay tests
pnpm test:watch   # NO FUNCIONA - no hay configuración
pnpm test:coverage # NO FUNCIONA - no hay tests
```

### Librerías de Testing (NO instaladas)
- Jest para testing unitario - NO INSTALADO
- React Testing Library para testing de componentes - NO INSTALADO  
- MSW para mocking de API - NO INSTALADO

**TODO: Implementar suite completa de testing**

## Deployment

### Proceso de Build (Funcional)
```bash
# Crear build de producción - FUNCIONA
pnpm build

# Vista previa del build localmente - FUNCIONA
pnpm preview
```

### Objetivos de Entorno
- **Desarrollo**: Servidor de desarrollo local (FUNCIONA en http://localhost:5173)
- **Staging**: NO CONFIGURADO
- **Producción**: Build optimizado con minificación (FUNCIONA)

**NOTA: No hay configuración de CI/CD ni deployment automático**

## Contribución

### Convención de Commits (Sugerida)
```
feat: agregar nueva funcionalidad
fix: correcciones de bugs
docs: actualizaciones de documentación
style: formateo de código
refactor: refactorización de código
test: adición/actualización de tests
```

### Proceso de Pull Request (Sugerido)
1. Crear rama de feature desde main
2. Implementar cambios con tests
3. Actualizar documentación
4. Enviar pull request con descripción
5. Revisión de código y aprobación
6. Merge a rama main

## Soporte de Navegadores

### Requerimientos Mínimos (Estimados)
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile Safari**: 14+
- **Chrome Mobile**: 90+

**NOTA: No se ha realizado testing exhaustivo en todos los navegadores**

### Mejora Progresiva
- Funcionalidad principal requiere JavaScript habilitado
- Experiencia mejorada con características de navegadores modernos
- NO hay degradación elegante para navegadores antiguos implementada

## Limitaciones Actuales

### Funcionalidades NO Implementadas
- Backend real o API (planificado: Supabase BaaS)
- Base de datos (planificado: Supabase Postgres)
- Autenticación de usuarios (planificado: Supabase Auth)
- Datos reales de transporte público
- Seguimiento en tiempo real
- Notificaciones push
- Tests automatizados
- CI/CD pipeline

### Próximos Pasos Sugeridos
1. Implementar backend con API REST
2. Conectar con datos reales de transporte
3. Agregar suite de testing completa
4. Configurar deployment automático
5. Implementar funcionalidades de las páginas placeholder
6. Optimizar para PWA (Progressive Web App)

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## Contacto

Para preguntas o soporte, por favor contacta al equipo de desarrollo o crea un issue en el repositorio:
- **Repositorio**: https://github.com/Cruz1122/rout2me
- **Rama Actual**: feat/passenger-app-init
