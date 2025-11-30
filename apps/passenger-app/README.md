# Rout2Me - Aplicación para Pasajeros

Una aplicación web moderna de transporte público desarrollada para Manizales, Colombia. Esta aplicación web móvil ayuda a los usuarios a encontrar rutas de autobús, paradas y información de transporte en tiempo real.

**Backend:** El proyecto utiliza Supabase como BaaS (Backend as a Service) con Postgres, Auth, Storage y REST API. La aplicación está completamente integrada con endpoints REST para obtener rutas, paradas y posiciones de buses en tiempo real.

## Stack Tecnológico

- **Framework Frontend**: React 19
- **Lenguaje**: TypeScript 5
- **Framework Móvil**: Ionic Framework 8
- **Herramienta de Build**: Vite 6
- **Estilos**: Tailwind CSS 3
- **Mapas**: MapLibre GL JS con tiles de CARTO (basado en OpenStreetMap)
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
  - Visualización de rutas con map matching (Stadia Maps)
  - Marcadores de paradas y buses en tiempo real
  - Caché optimizado de tiles para mejor rendimiento
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
- **Gestión de Rutas**: Visualización completa de rutas
  - Listado de todas las rutas disponibles
  - Visualización en mapa con coordenadas del backend
  - Filtros por rutas recientes
  - Información detallada de cada ruta
- **Seguimiento en Vivo**: Seguimiento de buses en tiempo real
  - Listado de todos los buses activos
  - Filtros por estado (todos, activos, cercanos)
  - Información de ubicación y estado de cada bus
  - Distancia desde la ubicación del usuario
- **Autenticación de Usuarios**: Sistema completo de autenticación
  - Registro de nuevos usuarios
  - Login con email y contraseña
  - Validación en tiempo real
  - Persistencia de sesión con localStorage
  - Gestión de perfil de usuario
  - Cambio de contraseña
- **Navegación**: Navegación basada en pestañas con iconos animados
- **Diseño Responsivo**: Mobile-first con UI glassmorphism

### Integración con Backend
- **API REST**: Integración completa con Supabase REST API
  - Endpoint `v_route_variants_agg`: Obtiene rutas con coordenadas y paradas
  - Endpoint `v_bus_latest_positions`: Obtiene posiciones actuales de buses
  - Transformación automática de coordenadas para MapLibre GL
- **Autenticación**: Integración con Supabase Auth
  - Registro y login de usuarios
  - Gestión de sesiones
  - Validación de tokens

### Datos Actuales
- **Fuente de Datos**: Backend Supabase con datos reales
- **Ubicación**: Centrado en Manizales, Colombia
- **Rutas**: Datos obtenidos desde la base de datos mediante endpoints REST
- **Buses**: Posiciones en tiempo real desde el backend

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
pnpm generate:icons # Generar iconos de la app para Android/iOS
```

### Generación de Iconos

El proyecto usa `@capacitor/assets` para generar automáticamente los iconos de la aplicación en todas las densidades necesarias para Android.

**Estructura requerida:**
```
assets/
└── icon.png  # Icono fuente (recomendado: 1024x1024px)
```

**Generar iconos:**
```bash
pnpm generate:icons
```

Este comando generará automáticamente todos los tamaños de iconos necesarios en `android/app/src/main/res/mipmap-*` y configurará los adaptive icons para Android 8.0+.

**Nota:** Si encuentras errores relacionados con `sharp`, puedes intentar:
1. Reinstalar sharp: `pnpm install --ignore-scripts=false sharp`
2. O usar npm directamente: `npm install --ignore-scripts=false sharp` en el workspace root

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

#### Variables Requeridas (Backend)

```env
# Configuración de Supabase Auth
VITE_BACKEND_AUTH_URL=https://your-project.supabase.co/auth/v1
VITE_SERVICE_ROLE_KEY=your-service-role-key-here

# Configuración de API REST
VITE_BACKEND_REST_URL=https://your-project.supabase.co/rest/v1
```

**Cómo obtener las credenciales:**
1. Ve a tu proyecto de Supabase
2. En el dashboard, ve a Settings > API
3. Copia la URL de Auth (formato: `https://[project-id].supabase.co/auth/v1`)
4. Copia la URL de REST API (formato: `https://[project-id].supabase.co/rest/v1`)
5. Copia la "service_role" key (NO la "anon" key)
   - ⚠️ **IMPORTANTE**: Esta clave debe mantenerse segura y nunca exponerse en el frontend en producción

#### Variables Opcionales (Map Matching)

El proyecto incluye **Map Matching** para ajustar las rutas dibujadas a las calles reales usando **Stadia Maps API**:

**Sin API Key:**
- ✅ El mapa funciona normalmente
- ⚠️ Las rutas se muestran como líneas directas entre puntos
- ⚠️ **NO se ajustan a las calles reales**

**Con API Key (Recomendado):**
- ✅ Las rutas se ajustan automáticamente a calles reales
- ✅ Respeta sentidos de vías y geometría vial
- ✅ Proporciona distancias y duraciones precisas

```env
# Map Matching con Stadia Maps (Opcional)
VITE_STADIA_API_KEY=50519f36-7eba-4cce-8e2d-62189257f2d4
```

**Obtener API Key gratuita:**
- Ve a: https://client.stadiamaps.com/signup/
- Crea una cuenta (plan gratuito disponible)
- Copia tu API key

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
- **Fuente de Tiles**: CARTO Light (basado en OpenStreetMap, gratuito, sin API key)
- **Controles de Navegación**: Botones personalizados (posicionados abajo-izquierda)
- **Caché de Tiles**: Sistema optimizado de caché para mejor rendimiento

## Estructura de Datos y Endpoints REST

**IMPORTANTE: Los datos se obtienen desde el backend Supabase mediante endpoints REST**

### Endpoints Utilizados

#### 1. `v_route_variants_agg` - Obtener Rutas y Coordenadas
Este endpoint devuelve todas las variantes de rutas con sus coordenadas y paradas agregadas.

**Estructura de respuesta:**
```typescript
interface ApiRouteVariantAggregated {
  route_id: string;
  route_code: string;
  route_name: string;
  route_active: boolean;
  variant_id: string;
  path: { lat: number; lng: number }[];  // Array de coordenadas
  length_m_json: number;
  stops: {
    id: string;
    name: string;
    location: { lat: number; lng: number };
  }[];
}
```

#### 2. `v_bus_latest_positions` - Obtener Posiciones de Buses
Este endpoint devuelve las últimas posiciones conocidas de todos los buses.

**Estructura de respuesta:**
```typescript
interface ApiBusLatestPosition {
  bus_id: string;
  plate: string;
  company_id: string;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  active_route_variant_id: string | null;
  location_json: { lat: number; lng: number } | null;
  speed_kph: number | null;
  heading: number | null;
}
```

**Más información:** Ver [README-MAP.md](./README-MAP.md#obtención-de-coordenadas-desde-endpoints-rest) para detalles completos sobre cómo obtener y transformar coordenadas desde estos endpoints.

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

### Transformación de Coordenadas

⚠️ **IMPORTANTE**: El backend devuelve coordenadas en formato `{lat, lng}`, pero MapLibre GL requiere `[lng, lat]`. El sistema realiza esta conversión automáticamente.

**Más información:** Ver [README-MAP.md](./README-MAP.md#resumen-de-conversiones-de-coordenadas) para detalles sobre las conversiones de coordenadas.

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
- **Búsqueda con debounce**: Para reducir búsquedas excesivas
- **Caché de rutas**: Sistema de caché para evitar peticiones repetidas a la API
- **Caché de tiles**: Precarga y caché inteligente de tiles del mapa
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
- Notificaciones push
- Tests automatizados
- CI/CD pipeline
- Optimización completa para PWA (Progressive Web App)
- Actualización en tiempo real con WebSockets (actualmente usa polling)

### Próximos Pasos Sugeridos
1. Implementar actualización en tiempo real con Supabase Realtime
2. Agregar suite de testing completa
3. Configurar deployment automático
4. Optimizar para PWA (Progressive Web App)
5. Implementar notificaciones push
6. Mejorar sistema de caché con Service Workers

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## Documentación Adicional

- **[README-MAP.md](./README-MAP.md)**: Guía completa sobre el sistema de mapas, caché, tiles, map matching, rutas, paradas y buses
- **[src/docs/README_AUTH.md](./src/docs/README_AUTH.md)**: Documentación del sistema de autenticación
- **[src/docs/README_ROUTES_SYSTEM.md](./src/docs/README_ROUTES_SYSTEM.md)**: Documentación del sistema de rutas y paradas

## Contacto

Para preguntas o soporte, por favor contacta al equipo de desarrollo o crea un issue en el repositorio:
- **Repositorio**: https://github.com/Cruz1122/rout2me
