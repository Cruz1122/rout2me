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
- **Lista de Vehículos**: Visualización de todos los buses registrados
- **Crear Vehículo**: Modal con formulario validado
  - Formato automático de placa: ABC-123 (3 letras, guión, 3 números)
  - Validación de capacidad y modelo
  - Selección de estado del vehículo
- **Detalle de Vehículo**: Panel lateral con información completa
- **Integración con API Real**: Conexión directa con Supabase REST API

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
│   └── vehicles_api.ts     # Funciones de gestión de vehículos
├── assets/                 # Imágenes y recursos estáticos
├── components/
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
│   └── Vehicles.tsx        # Gestión de vehículos
├── routes/
│   └── AppRoutes.tsx       # Configuración de rutas
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
```

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

### Formato de Fecha
Las fechas se manejan en formato ISO 8601 desde Supabase.

### Passenger Count Default
Cuando `passenger_count` viene como `null` desde la API, se establece automáticamente a `0` usando nullish coalescing operator (`??`).

## 🤝 Contribución

Este proyecto es parte del curso de Soft III, Semestre VII, Universidad.

## 📄 Licencia

Este proyecto es de uso académico.
