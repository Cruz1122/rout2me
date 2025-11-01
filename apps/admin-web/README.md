# Rout2Me - Admin Web

Panel de administración web para la plataforma Rout2Me, un sistema de gestión de transporte urbano con monitoreo en tiempo real.

## 🚀 Características

### Autenticación Completa
- **Sistema de Registro (SignUp)**: Formulario completo con validaciones
  - Validación de email con regex
  - Contraseña mínimo 8 caracteres
  - Nombre mínimo 3 caracteres
  - Teléfono exactamente 10 dígitos
  - Verificación de email mediante Supabase
- **Inicio de Sesión (SignIn)**: Autenticación segura con tokens JWT
- **Verificación de Email**: Página de confirmación con redirección automática
- **Cierre de Sesión**: Modal de confirmación con limpieza completa de localStorage
- **Persistencia de Sesión**: Los tokens se mantienen al recargar la página
- **Rutas Protegidas**: Sistema de guardias para proteger el dashboard

### Dashboard con Mapas en Tiempo Real (NUEVO)
- **Mapa Interactivo**: Visualización con MapLibre GL y tiles de CARTO OpenStreetMap
- **Buses en Tiempo Real**: Marcadores de buses con posición GPS actualizada cada 10 segundos
- **Rutas Dinámicas**: Dibujo automático de rutas con Map Matching (Stadia Maps API)
- **Colores por Organización**: Cada compañía tiene un color único para identificar sus buses y rutas
- **Selección de Buses**: Click en bus para destacarlo (reduce opacidad de otros buses/rutas a 20%)
- **Leyenda Dinámica**: Lista de compañías con sus colores asignados
- **Controles de Mapa**:
  - Zoom In/Out
  - Resetear Norte (brújula)
  - Centrar en ubicación del usuario
  - Rotación del mapa con drag en la brújula
- **Filtrado Inteligente**:
  - Solo muestra buses de tu organización (RLS de Supabase)
  - Solo dibuja rutas de buses con GPS activo
  - Excluye buses sin ubicación
- **Popups Informativos**: Información de placa, compañía y estado al hacer click en un bus
- **KPIs Actualizados en Tiempo Real**:
  - Buses Activos (solo con GPS)
  - Ocupación Promedio
  - Rutas en Servicio (solo rutas activas con buses GPS)
  - Incidentes Abiertos
  - Tasa de Puntualidad
  - Actualización de Telemetría
- **Optimización de Costos**: Map matching se ejecuta solo una vez al cargar, no en cada refresh

### Gestión de Vehículos
- **Lista de Vehículos**: Visualización de todos los buses registrados con paginación
- **Crear Vehículo**: Modal con formulario validado
  - Formato automático de placa: ABC-123 (3 letras, guión, 3 números)
  - Validación de capacidad y modelo
  - Selección de estado del vehículo
- **Detalle de Vehículo**: Panel lateral con información completa
- **Paginación**: Selector de 5, 10 o 15 filas por página
- **Búsqueda en Tiempo Real**: Filtrado por placa del vehículo
- **Integración con API Real**: Conexión directa con Supabase REST API

### Rastreo de Flota en Vivo (LiveFleet) (NUEVO)
- **Mapa de Seguimiento**: Vista de mapa completo con todos los buses activos
- **Búsqueda de Vehículos**: Filtro por placa en tiempo real
- **Visualización de Rutas**: Al seleccionar un bus, muestra su ruta completa con paradas
- **Marcadores de Paradas**: Círculos naranjas con nombres de paradas
- **Auto-refresh**: Actualización automática de posiciones cada 10 segundos
- **Controles de Navegación**: Zoom, reset norte, centrar en usuario
- **Panel Lateral**: Lista de vehículos con información de estado y selección

### Gestión de Usuarios
- **Lista de Usuarios**: Visualización completa de usuarios del sistema
- **Crear Usuario**: Modal con formulario validado mediante API Admin
  - Validación de email con regex
  - Contraseña mínima de 6 caracteres
  - Nombre completo obligatorio
  - Teléfono con formato internacional (+57...)
  - Confirmación automática de email
- **Editar Usuario**: Actualización de datos con contraseña opcional
- **Eliminar Usuario**: Modal de confirmación antes de eliminar
- **Detalle de Usuario**: Panel lateral con información completa
  - ID de usuario
  - Nombre, email, teléfono
  - Rol del usuario (Admin, Usuario, Conductor, Supervisor)
  - Estado de verificación de email
  - Fecha de creación
- **Paginación**: Selector de 5, 10 o 15 filas por página
- **Búsqueda en Tiempo Real**: Filtrado por nombre o email
- **API Admin de Supabase**: Uso de Service Role Key para operaciones CRUD
- **Toast Notifications**: Feedback visual para todas las operaciones

## 🛠️ Tecnologías

- **React 19.1.1** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite 6.3.3** - Build tool y dev server
- **React Router DOM 6.14.2** - Enrutamiento
- **Tailwind CSS 4.1.14** - Estilos utility-first
- **Supabase** - Backend as a Service
- **Fetch API** - Peticiones HTTP (sin SDK de Supabase)
- **MapLibre GL 5.9.0** (NUEVO) - Renderizado de mapas open-source
- **React Icons 5.5.0** (NUEVO) - Iconos para controles de UI
- **Stadia Maps API** (NUEVO) - Map matching para rutas optimizadas

## 📁 Estructura del Proyecto

```
src/
├── api/
│   ├── auth_api.ts         # Funciones de autenticación
│   ├── vehicles_api.ts     # Funciones de gestión de vehículos + GPS positions
│   └── users_api.ts        # Funciones de gestión de usuarios
├── services/
│   └── mapMatchingService.ts  # Servicio de map matching con Stadia Maps (NUEVO)
├── assets/                 # Imágenes y recursos estáticos
├── public/                 # Archivos públicos estáticos (NUEVO)
│   ├── icon.webp           # Icono de perfil (5.8KB)
│   ├── icon-metadata.webp  # Favicon de la página (16KB)
│   ├── onboarding.png      # Imagen de onboarding
│   └── sw.js               # Service Worker
├── components/
│   ├── Layout.tsx          # Layout principal con Sidebar y Navbar
│   ├── Navbar.tsx          # Barra de navegación superior con perfil
│   ├── Sidebar.tsx         # Menú lateral de navegación (sticky)
│   ├── ProtectedRoute.tsx  # Guardia de rutas privadas
│   └── PublicRoute.tsx     # Guardia de rutas públicas
├── context/
│   └── AuthContext.tsx     # Contexto global de autenticación
├── pages/
│   ├── AuthCallback.tsx    # Callback de verificación de email
│   ├── EmailVerified.tsx   # Página de email verificado
│   ├── HomePage.tsx        # Dashboard principal con mapa (ACTUALIZADO)
│   ├── LiveFleet.tsx       # Rastreo de flota en vivo (NUEVO)
│   ├── SignIn.tsx          # Página de inicio de sesión
│   ├── SignUp.tsx          # Página de registro
│   ├── Vehicles.tsx        # Gestión de vehículos
│   └── Users.tsx           # Gestión de usuarios
├── routes/
│   └── AppRoutes.tsx       # Configuración de rutas
├── styles/
│   └── colors.ts           # Paleta de colores centralizada
├── lib/
│   └── supabase.ts         # Configuración de Supabase
├── App.tsx                 # Componente raíz
├── main.tsx               # Punto de entrada con CSS de MapLibre
└── index.css              # Estilos globales
```

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://rcdsqsvfxyfnrueoovpy.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
VITE_STADIA_API_KEY=tu_clave_stadia_maps_aqui
```

> **⚠️ IMPORTANTE**: 
> - La `VITE_SUPABASE_SERVICE_ROLE_KEY` debe mantenerse **PRIVADA** y solo usarse en operaciones administrativas.
> - La `VITE_STADIA_API_KEY` es opcional. Si no se proporciona, las rutas se dibujarán sin map matching.
> - Nunca expongas estas claves en el código del cliente en producción.

### Instalación

```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm run dev

# Compilar para producción
pnpm run build

# Vista previa de producción
pnpm run preview
```

## 🗺️ Sistema de Mapas

### Configuración de MapLibre GL
El mapa utiliza tiles de CARTO OpenStreetMap como base:
- Centro por defecto: Manizales, Colombia `[-75.5138, 5.0703]`
- Zoom inicial: 12
- Tiles: `https://{a,b,c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png`

### Map Matching con Stadia Maps
Para mejorar la visualización de rutas, se utiliza la API de Stadia Maps:
1. Las coordenadas crudas del GPS se envían a Stadia Maps
2. El servicio devuelve una geometría optimizada que sigue las calles reales
3. **Optimización de costos**: El map matching se ejecuta una sola vez al cargar el mapa
4. Las actualizaciones de posición (cada 10s) NO recargan las rutas

### Filtrado por Organización
- Los buses se filtran usando Row Level Security (RLS) de Supabase
- Solo se muestran buses de la organización del usuario autenticado
- Las rutas solo se dibujan si tienen buses activos con GPS

### Colores por Compañía
Sistema de 10 colores predefinidos asignados consistentemente:
```typescript
const ORGANIZATION_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
];
```

### Actualización en Tiempo Real
- **Intervalo**: 10 segundos
- **Datos actualizados**: Posiciones GPS de buses
- **Datos estáticos**: Rutas y variantes (cargados una vez)
- **Efecto visual**: Marcadores se mueven suavemente entre posiciones

## 🔐 Sistema de Autenticación

### Flujo de Registro
1. Usuario completa formulario en `/signup`
2. Validación de campos en frontend
3. POST a `/auth/v1/signup` con datos del usuario
4. Supabase envía email de verificación
5. Usuario hace clic en el enlace del email
6. Redirección a `/auth/callback` que procesa el token
7. Redirección a `/email-verified` con confirmación
8. Countdown de 5 segundos y redirección automática a `/signin`

### Flujo de Inicio de Sesión
1. Usuario ingresa credenciales en `/signin`
2. POST a `/auth/v1/token?grant_type=password`
3. Recepción de `access_token` y `refresh_token`
4. Almacenamiento en localStorage y AuthContext
5. Redirección automática a `/home`

### Flujo de Protección de Rutas
- **ProtectedRoute**: Verifica token antes de mostrar rutas privadas
- **PublicRoute**: Redirige a home si el usuario ya está autenticado
- **Loading State**: Previene parpadeos durante la verificación inicial

### Almacenamiento
```typescript
localStorage.setItem('access_token', token)
localStorage.setItem('refresh_token', refreshToken)
localStorage.setItem('user', JSON.stringify(userData))
```

## 🚗 API de Vehículos

### Endpoints Utilizados

```typescript
// Obtener todos los vehículos
GET /rest/v1/buses
Headers:
  - Authorization: Bearer {token}
  - apikey: {supabase_anon_key}

// Crear vehículo
POST /rest/v1/buses
Headers:
  - Authorization: Bearer {token}
  - apikey: {supabase_anon_key}
  - Content-Type: application/json
  - Prefer: return=representation
Body: {
  license_plate: "ABC-123",
  model: "Mercedes Benz",
  capacity: 40,
  status: "AVAILABLE",
  company_id: "uuid"
}
```

### Formato de Placa
- **Patrón**: `ABC-123` (3 letras mayúsculas, guión, 3 números)
- **Validación**: `/^[A-Z]{3}-\d{3}$/`
- **Formateo Automático**: Se inserta el guión automáticamente al escribir

### Estados de Vehículo
- `AVAILABLE` - Disponible
- `IN_SERVICE` - En Servicio
- `MAINTENANCE` - En Mantenimiento
- `OUT_OF_SERVICE` - Fuera de Servicio

## 👥 API de Usuarios

### Endpoints Admin de Supabase

```typescript
// Obtener todos los usuarios (requiere Service Role Key)
GET /auth/v1/admin/users?per_page=50&page=1
Headers:
  - apikey: {service_role_key}
  - Authorization: Bearer {service_role_key}
  - Content-Type: application/json

// Crear usuario (Admin endpoint)
POST /auth/v1/admin/users
Headers:
  - apikey: {service_role_key}
  - Authorization: Bearer {service_role_key}
  - Content-Type: application/json
Body: {
  email: "usuario@example.com",
  password: "password123",
  email_confirm: true,
  user_metadata: {
    name: "Juan Pérez",
    phone: "+573001234567"
  }
}

// Actualizar usuario
PUT /auth/v1/admin/users/{userId}
Headers:
  - apikey: {service_role_key}
  - Authorization: Bearer {service_role_key}
  - Content-Type: application/json
Body: {
  email: "nuevoemail@example.com",
  password: "newpassword123",  // Opcional
  user_metadata: {
    name: "Juan Pérez Actualizado",
    phone: "+573009876543"
  }
}

// Eliminar usuario
DELETE /auth/v1/admin/users/{userId}
Headers:
  - apikey: {service_role_key}
  - Authorization: Bearer {service_role_key}
```

### Tipos de Usuario

```typescript
export type UserRole = 'admin' | 'user' | 'driver' | 'supervisor';

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: UserRole;
  created_at: string;
  email_confirmed_at?: string;
};
```

### Validaciones de Usuario
- **Email**: Formato válido según regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password**: Mínimo 6 caracteres (opcional en edición)
- **Nombre**: Campo obligatorio
- **Teléfono**: Formato internacional `/^\+?\d{10,15}$/` (ej: +573001234567)

### Características Especiales
- **Contraseña Opcional en Edición**: Al actualizar un usuario, la contraseña es opcional. Si no se proporciona, se mantiene la actual.
- **Email Confirmado Automáticamente**: Al crear usuarios mediante el endpoint admin, se pueden confirmar automáticamente con `email_confirm: true`.
- **User Metadata**: Información adicional (nombre, teléfono) se almacena en `user_metadata` de Supabase Auth.

## 📡 APIs de Vehículos y Rutas

### Endpoints de Vehículos

```typescript
// Obtener vehículos de mi organización (con RLS)
GET /rest/v1/buses?select=id,plate,capacity,status,created_at,last_maintenance,passenger_count,company:companies(id,name,short_name)&order=created_at.desc
Headers:
  - apikey: {anon_key}
  - Authorization: Bearer {access_token}
  - Content-Type: application/json

// Obtener posiciones GPS de todos los buses
GET /rest/v1/v_bus_latest_positions?select=bus_id,plate,company_id,status,active_trip_id,active_route_variant_id,vp_id,vp_at,location_json,speed_kph,heading&order=plate.asc
Headers:
  - apikey: {anon_key}
  - Authorization: Bearer {access_token}
  - Content-Type: application/json

// Obtener variantes de rutas con paradas
GET /rest/v1/v_route_variants_agg?select=route_id,route_code,route_name,route_active,variant_id,path,length_m_json,stops&order=route_code.asc,variant_id.asc
Headers:
  - apikey: {anon_key}
  - Authorization: Bearer {access_token}
  - Content-Type: application/json

// Obtener todas las compañías
GET /rest/v1/companies?select=id,name,short_name&order=name.asc
Headers:
  - apikey: {anon_key}
  - Authorization: Bearer {access_token}
  - Content-Type: application/json
```

### Tipos de Datos

```typescript
export type BusPosition = {
  bus_id: string;
  plate: string;
  company_id: string;
  status: string;
  active_trip_id: string | null;
  active_route_variant_id: string | null;
  vp_id: string;
  vp_at: string;
  location_json: BusLocation;
  speed_kph: number;
  heading: number;
};

export type RouteVariant = {
  route_id: string;
  route_code: string;
  route_name: string;
  route_active: boolean;
  variant_id: string;
  path: BusLocation[];
  length_m_json: number;
  stops: RouteStop[];
};

export type Company = {
  id: string;
  name: string;
  short_name: string;
  org_key: string;
};
```

### Filtrado y Optimización
1. **Primera carga**:
   - `getVehicles()` → Buses de mi organización (filtrados por RLS)
   - `getBusPositions()` → Todas las posiciones GPS del sistema
   - Filtrado local: Solo posiciones de buses en `myVehicles`
   - Solo se dibujan rutas con buses que tienen GPS activo

2. **Auto-refresh (cada 10s)**:
   - Solo actualiza `getBusPositions()`
   - Usa `vehiclesRef` para mantener el filtro sin recargar vehículos
   - No recarga rutas (optimización de costos de map matching)

3. **Lógica de filtrado**:
```typescript
const myBusIds = new Set(vehicles.map(v => v.id));
const filteredPositions = data.filter(pos => 
  myBusIds.has(pos.bus_id) && 
  pos.active_route_variant_id && 
  pos.company_id && 
  pos.location_json
);
```

## 🎨 Estilos y UI

### Diseño Responsivo
- Tailwind CSS con configuración personalizada
- Layout adaptable a diferentes tamaños de pantalla
- Modales centrados con overlay semi-transparente
- Sidebar con posición fixed para scroll persistente

### Paleta de Colores
- Primario: Verde (#10B981, #059669)
- Secundario: Azul (#3B82F6, #2563EB)
- Advertencia: Amarillo (#F59E0B, #D97706)
- Peligro: Rojo (#EF4444, #DC2626)
- Éxito: Verde (#22C55E, #16A34A)

### Componentes Principales
- **Modales**: Overlay con `bg-black/40`, contenido centrado con `z-50`
- **Formularios**: Inputs con validación visual y mensajes de error
- **Tablas**: Filas con hover y selección destacada
- **Botones**: Variantes primary, secondary, outline, danger
- **Mapas**: Controles flotantes con fondo blanco y sombras

## 🔄 Manejo de Estados

### AuthContext
```typescript
interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  clearAuth: () => void
}
```

### Vehicle State
```typescript
interface Vehicle {
  id: string
  license_plate: string
  model: string
  capacity: number
  passenger_count: number
  status: VehicleStatus
  company_id: string
}
```

### User State (NUEVO)
```typescript
interface User {
  id: string
  email: string
  name: string
  phone: string
  role?: UserRole
  created_at: string
  email_confirmed_at?: string
}

type UserRole = 'admin' | 'user' | 'driver' | 'supervisor'
```

### Paginación (NUEVO)
Tanto la página de vehículos como la de usuarios implementan paginación:
```typescript
const [currentPage, setCurrentPage] = useState(1)
const [rowsPerPage, setRowsPerPage] = useState(10) // 5, 10 o 15

// Cálculo de elementos a mostrar
const paginatedItems = filteredItems.slice(
  (currentPage - 1) * rowsPerPage,
  currentPage * rowsPerPage
)
```

## 🐛 Manejo de Errores

### Estrategias Implementadas
1. **Try-Catch en todas las llamadas API**
2. **Logging detallado con console.error**
3. **Mensajes de error al usuario mediante toast**
4. **Valores por defecto para datos nulos** (ej: passenger_count = 0)
5. **Validación de formularios antes de enviar**

### Ejemplo
```typescript
try {
  const response = await fetch(url, options)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }
  return await response.json()
} catch (error) {
  console.error('Error en operación:', error)
  toast.error('Mensaje descriptivo para el usuario')
  throw error
}
```

## 📝 Scripts Disponibles

```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "tsc -b && vite build",  // Compilación TypeScript + Vite
  "lint": "eslint .",               // Análisis de código
  "preview": "vite preview"         // Preview de build de producción
}
```

## 🔒 Seguridad

- Tokens JWT almacenados en localStorage
- Headers de autorización en todas las peticiones protegidas
- Validación de datos en frontend antes de enviar
- Rutas protegidas con guardias de autenticación
- Limpieza completa de datos al cerrar sesión
- Email verification obligatoria para registro

## 🚧 Notas Técnicas

### ¿Por qué no se usa @supabase/supabase-js?
El proyecto está en una estructura de monorepo y npm install falla al intentar instalar el SDK. Se optó por usar Fetch API directo con los endpoints REST de Supabase, lo cual funciona perfectamente.

### Service Role Key vs Anon Key
- **Anon Key**: Se usa para operaciones normales de la aplicación (vehículos, autenticación básica)
- **Service Role Key**: Se usa **exclusivamente** para operaciones administrativas de usuarios (crear, actualizar, eliminar) ya que requiere permisos elevados. **NO exponer en producción**.

### Formato de Fecha
Las fechas se manejan en formato ISO 8601 desde Supabase.

### Passenger Count Default
Cuando `passenger_count` viene como `null` desde la API, se establece automáticamente a `0` usando nullish coalescing operator (`??`).

### Búsqueda y Filtrado
La búsqueda se implementa en el cliente usando `.filter()`:
- **Vehículos**: Búsqueda por placa
- **Usuarios**: Búsqueda por nombre O email
- Ambas son case-insensitive y en tiempo real

### Toast Notifications
Sistema de notificaciones implementado con:
- Animaciones de entrada/salida suaves (300ms)
- Auto-dismiss después de 4 segundos
- Cleanup de timers para prevenir memory leaks
- Estilos diferenciados para success/error

## 🤝 Contribución

Este proyecto es parte del curso de Soft III, Semestre VII, Universidad.

## � Historial de Cambios

### 30 de Octubre, 2025 - Sistema Completo de Gestión de Usuarios

#### ✨ Nuevas Características
- **Página de Gestión de Usuarios** (`/users`)
  - CRUD completo: Crear, Listar, Actualizar y Eliminar usuarios
  - Layout consistente con la página de vehículos (panel izquierdo de detalles + tabla derecha)
  - Integración con Supabase Admin API usando Service Role Key
  
- **API de Usuarios** (`src/api/users_api.ts`)
  - `getUsers()`: Obtener lista completa de usuarios
  - `createUser()`: Crear nuevos usuarios con confirmación automática de email
  - `updateUser()`: Actualizar datos de usuario con contraseña opcional
  - `deleteUser()`: Eliminar usuarios del sistema
  - `getUserRole()`: Consultar roles desde tabla user_roles
  
- **Funcionalidades de UI**
  - Paginación configurable (5, 10 o 15 filas por página)
  - Búsqueda en tiempo real por nombre o email
  - Modales para crear, editar y eliminar con validaciones
  - Panel de detalles con información completa del usuario
  - Toast notifications para feedback de operaciones
  - Validación de formularios con mensajes de error
  
- **Sistema de Navegación Actualizado**
  - Opción "Usuarios" agregada al Sidebar
  - Opción "Usuarios" agregada al Navbar
  - Ruta protegida `/users` configurada en AppRoutes

#### 🔧 Mejoras en Vehículos
- Paginación implementada (5, 10 o 15 filas)
- Búsqueda en tiempo real por placa
- Eliminación de filtros no funcionales
- Mejoras en la experiencia de usuario

#### 🎨 Mejoras de UI/UX
- Botón "Nuevo Usuario" con ícono "+"
- Controles de paginación consistentes en ambas páginas
- Filtros de búsqueda con reset de página automático
- Feedback visual para todas las operaciones (success/error)
- Campos de formulario con validación en tiempo real

#### 🔐 Seguridad
- Uso de Service Role Key para operaciones administrativas
- Variable de entorno `VITE_SUPABASE_SERVICE_ROLE_KEY` agregada
- Validaciones de datos antes de enviar a la API
- Manejo apropiado de user_metadata de Supabase Auth

#### 📝 Documentación
- README actualizado con toda la información de usuarios
- Documentación de endpoints Admin de Supabase
- Tipos TypeScript documentados
- Notas sobre Service Role Key vs Anon Key

## �📄 Licencia

Este proyecto es de uso académico.
