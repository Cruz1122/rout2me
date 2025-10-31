# Rout2Me - Admin Web

Panel de administración web para la plataforma Rout2Me, un sistema de gestión de transporte urbano.

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

### Gestión de Usuarios (NUEVO)
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

### Dashboard
- **KPIs en Tiempo Real**: Buses activos, ocupación promedio, rutas activas, pasajeros hoy
- **Gráficos de Tendencias**: Visualización de ocupación por hora
- **Tabla de Buses**: Lista con estado, ruta y ocupación actual
- **Tabla de Rutas**: Información de rutas con buses asignados y pasajeros
- **Interfaz Completamente en Español**

## 🛠️ Tecnologías

- **React 19.1.1** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite 6.3.3** - Build tool y dev server
- **React Router DOM 6.14.2** - Enrutamiento
- **Tailwind CSS 4.1.14** - Estilos utility-first
- **Supabase** - Backend as a Service
- **Fetch API** - Peticiones HTTP (sin SDK de Supabase)

## 📁 Estructura del Proyecto

```
src/
├── api/
│   ├── auth_api.ts         # Funciones de autenticación
│   ├── vehicles_api.ts     # Funciones de gestión de vehículos
│   └── users_api.ts        # Funciones de gestión de usuarios (NUEVO)
├── assets/                 # Imágenes y recursos estáticos
├── components/
│   ├── Layout.tsx          # Layout principal con Sidebar y Navbar
│   ├── Navbar.tsx          # Barra de navegación superior
│   ├── Sidebar.tsx         # Menú lateral de navegación
│   ├── ProtectedRoute.tsx  # Guardia de rutas privadas
│   └── PublicRoute.tsx     # Guardia de rutas públicas
├── context/
│   └── AuthContext.tsx     # Contexto global de autenticación
├── pages/
│   ├── AuthCallback.tsx    # Callback de verificación de email
│   ├── EmailVerified.tsx   # Página de email verificado
│   ├── HomePage.tsx        # Dashboard principal
│   ├── SignIn.tsx          # Página de inicio de sesión
│   ├── SignUp.tsx          # Página de registro
│   ├── Vehicles.tsx        # Gestión de vehículos
│   └── Users.tsx           # Gestión de usuarios (NUEVO)
├── routes/
│   └── AppRoutes.tsx       # Configuración de rutas
├── styles/
│   └── colors.ts           # Paleta de colores centralizada
├── lib/
│   └── supabase.ts         # Configuración de Supabase
├── App.tsx                 # Componente raíz
├── main.tsx               # Punto de entrada
└── index.css              # Estilos globales
```

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://rcdsqsvfxyfnrueoovpy.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

> **⚠️ IMPORTANTE**: La `VITE_SUPABASE_SERVICE_ROLE_KEY` debe mantenerse **PRIVADA** y solo usarse en operaciones administrativas. Nunca la expongas en el código del cliente en producción.

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

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

## 🎨 Estilos y UI

### Diseño Responsivo
- Tailwind CSS con configuración personalizada
- Layout adaptable a diferentes tamaños de pantalla
- Modales centrados con overlay semi-transparente

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
