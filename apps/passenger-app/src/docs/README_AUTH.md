# Sistema de Autenticación Completo - Rout2Me

## 🎯 **Resumen**

Sistema completo de autenticación para aplicaciones móviles Ionic que integra **Supabase Auth** con **localStorage** para persistencia de sesiones. Incluye registro, login, validación en tiempo real, y manejo de estado reactivo.

---

## 🔧 **Configuración de Entorno**

### **Variables de Entorno Requeridas**

Para que el sistema funcione correctamente, configura las siguientes variables en tu archivo `.env`:

```bash
# Configuración de Supabase Auth
VITE_BACKEND_AUTH_URL=https://your-project.supabase.co/auth/v1
VITE_SERVICE_ROLE_KEY=your-service-role-key-here

# Configuración de API REST (ya existente)
VITE_BACKEND_REST_URL=https://your-project.supabase.co/rest/v1

# Configuración de Mapas (ya existente)
VITE_STADIA_API_KEY=your-stadia-api-key-here
```

### **Cómo Obtener las Credenciales**
### **Deep links para OAuth móvil (Android/iOS)**

Para que Supabase pueda regresar correctamente a la app después de OAuth, se configuró el esquema nativo `rout2me://auth/callback`. Asegúrate de replicar estos pasos si recreas la plataforma móvil:

1. **Capacitor (`capacitor.config.ts`)**

```ts
export default {
  server: { androidScheme: 'https', iosScheme: 'https' },
  plugins: {
    App: { allowScheme: 'rout2me' },
  },
};
```

2. **Android (`android/app/src/main/AndroidManifest.xml`)**

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="rout2me" android:host="auth" android:pathPrefix="/callback" />
</intent-filter>
```

3. **Supabase Dashboard → Authentication → URL Configuration**

Agrega la URL exacta `rout2me://auth/callback`.

4. **Código**

```ts
const redirectTo = Capacitor.isNativePlatform()
  ? 'rout2me://auth/callback'
  : window.location.origin + '/inicio';

if (Capacitor.isNativePlatform()) {
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  await Browser.open({ url: data?.url!, windowName: '_self' });
} else {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: false },
  });
}

App.addListener('appUrlOpen', async ({ url }) => {
  if (url?.startsWith('rout2me://auth/callback')) {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');

    if (code) {
      await supabase.auth.exchangeCodeForSession({ authCode: code });
    }

    router.push('/inicio');
  }
});
```

> Este flujo está implementado en `authService.ts` y `features/auth/components/OAuthHandler.tsx`.

### **Cómo Obtener las Credenciales**

#### **1. BACKEND_AUTH_URL**
- Ve a tu proyecto de Supabase
- En el dashboard, ve a Settings > API
- Copia la URL de Auth (formato: `https://[project-id].supabase.co/auth/v1`)

#### **2. SERVICE_ROLE_KEY**
- En el mismo lugar (Settings > API)
- Copia la "service_role" key (NO la "anon" key)
- ⚠️ **IMPORTANTE**: Esta clave debe mantenerse segura

#### **3. BACKEND_REST_URL**
- En Settings > API
- Copia la URL de REST API (formato: `https://[project-id].supabase.co/rest/v1`)

---

## 🌐 **Endpoints de Autenticación**

### **Registro de Usuario**

**POST** `{{VITE_BACKEND_AUTH_URL}}/signup`

#### **Headers Utilizados**
```javascript
{
  'Content-Type': 'application/json',
  apikey: VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${VITE_SERVICE_ROLE_KEY}`
}
```

#### **Cuerpo de la Petición**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "data": {
    "name": "Nombre Usuario",
    "phone": "+573001234567",
    "company_key": "ABC123"
  }
}
```

### **Login de Usuario**

**POST** `{{VITE_BACKEND_AUTH_URL}}/token?grant_type=password`

#### **Headers Utilizados**
```javascript
{
  'Content-Type': 'application/json',
  apikey: VITE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${VITE_SERVICE_ROLE_KEY}`
}
```

#### **Cuerpo de la Petición**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

#### **Respuesta Exitosa**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1761543792,
  "refresh_token": "xim3sawyvmxf",
  "user": {
    "id": "2f92c9f5-64ac-45b2-bf4a-bf5b248c49ae",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "usuario@ejemplo.com",
    "email_confirmed_at": "2025-10-27T04:30:02.973559Z",
    "phone": "+573214650754",
    "phone_confirmed_at": null,
    "confirmation_sent_at": "2025-10-27T04:23:18.046318Z",
    "confirmed_at": "2025-10-27T04:30:02.973559Z",
    "recovery_sent_at": null,
    "last_sign_in_at": "2025-10-27T04:43:12.343152132Z",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "company_key": "531204",
      "email": "usuario@ejemplo.com",
      "email_verified": true,
      "name": "Camilo",
      "phone": "+573214650754",
      "phone_verified": false,
      "sub": "2f92c9f5-64ac-45b2-bf4a-bf5b248c49ae"
    },
    "identities": [...],
    "created_at": "2025-10-27T04:23:17.916442Z",
    "updated_at": "2025-10-27T04:43:12.368967Z",
    "is_anonymous": false
  },
  "weak_password": null
}
```

---

## 🏗️ **Arquitectura del Sistema**

### **1. Interfaces y Tipos (`authService.ts`)**

```typescript
// Respuesta completa del login de Supabase
interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: { /* datos completos del usuario */ };
  weak_password: null;
}

// Sesión simplificada para almacenar
interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    user_metadata: {
      company_key: string;
      name: string;
      phone: string;
    };
  };
}
```

### **2. Servicio de Almacenamiento (`authStorage`)**

```typescript
export const authStorage = {
  // Claves para localStorage
  SESSION_KEY: 'rout2me_auth_session',
  TIMESTAMP_KEY: 'rout2me_auth_timestamp',

  // Métodos principales
  saveSession(session: AuthSession): void
  getSession(): AuthSession | null
  isSessionValid(): boolean
  clearSession(): void
  getAccessToken(): string | null
  getUser(): AuthSession['user'] | null
  getRefreshToken(): string | null
  isAuthenticated(): boolean
  getTimeRemaining(): number
};
```

### **3. Hook React (`useAuth`)**

```typescript
export function useAuth() {
  return {
    // Estado
    session: AuthSession | null,
    isAuthenticated: boolean,
    isLoading: boolean,
    
    // Datos del usuario
    user: AuthSession['user'] | null,
    accessToken: string | null,
    refreshToken: string | null,
    
    // Acciones
    login: (response: LoginResponse) => void,
    logout: () => void,
    refreshSession: () => void,
    
    // Utilidades
    isSessionExpiringSoon: boolean,
    timeRemaining: number,
  };
}
```

---

## 🚀 **Características Implementadas**

### ✅ **Registro de Usuario**
- **Personal**: Nombre, email, contraseña y teléfono opcional
- **Organizacional**: Todos los campos + clave de organización de 6 caracteres
- **Validación en tiempo real** con campos marcados en rojo
- **Formato automático** del teléfono colombiano (+57)
- **Interfaz de múltiples pasos** con indicador de progreso
- **Mensaje de confirmación** con detalles del usuario

### ✅ **Login de Usuario**
- **Autenticación con Supabase** usando email/contraseña
- **Guardado automático** de sesión en localStorage
- **Redirección directa** a `/inicio` sin mensajes de bienvenida
- **Manejo robusto** de errores con mensajes específicos

### ✅ **Sistema de Almacenamiento**
- **localStorage** para persistencia entre reinicios de app
- **Validación automática** de expiración de tokens
- **Limpieza automática** de sesiones expiradas
- **Manejo de errores** con datos corruptos

### ✅ **Estado Reactivo**
- **Hook personalizado** para estado global de autenticación
- **Actualizaciones automáticas** cuando cambia la sesión
- **Estado de carga** para UX mejorada
- **Hooks especializados** para casos específicos

### ✅ **Seguridad**
- **Tokens JWT** almacenados de forma segura
- **Validación de expiración** en cada acceso
- **No almacenar contraseñas** en localStorage
- **Limpieza automática** de datos corruptos

---

## 📱 **Uso en Componentes**

### **Login Exitoso**
```typescript
const { login } = useAuth();

const handleLogin = async (loginData) => {
  const response = await loginUser(loginData);
  login(response); // Guarda automáticamente en localStorage
  router.push('/inicio');
};
```

### **Verificar Autenticación**
```typescript
const { isAuthenticated, user } = useAuth();

if (!isAuthenticated) {
  return <LoginPage />;
}

return <div>Hola {user?.user_metadata.name}!</div>;
```

### **Hacer Peticiones Autenticadas**
```typescript
const { accessToken, isAuthenticated } = useAuth();

const fetchData = async () => {
  if (!isAuthenticated) return;
  
  const response = await fetch('/api/data', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
};
```

### **Cerrar Sesión**
```typescript
const { logout } = useAuth();

const handleLogout = () => {
  logout(); // Limpia localStorage automáticamente
  router.push('/welcome');
};
```

### **Verificar Sesión Próxima a Expirar**
```typescript
const { isSessionExpiringSoon, timeRemaining, refreshSession } = useAuth();

if (isSessionExpiringSoon) {
  return (
    <div style={{ backgroundColor: '#fef3c7', padding: '12px' }}>
      <p>⚠️ Tu sesión expira en {Math.floor(timeRemaining / 60)} minutos</p>
      <button onClick={refreshSession}>Refrescar Sesión</button>
    </div>
  );
}
```

---

## 🔄 **Flujo Completo del Sistema**

### **1. Registro**
1. Usuario completa formulario de múltiples pasos
2. `signupUser()` llama a Supabase `/signup`
3. Validación en tiempo real con campos marcados en rojo
4. Mensaje de confirmación con instrucciones de email
5. Redirección automática al login

### **2. Login**
1. Usuario ingresa credenciales
2. `loginUser()` llama a Supabase `/token?grant_type=password`
3. `createAuthSession()` simplifica la respuesta
4. `authStorage.saveSession()` guarda en localStorage
5. `useAuth` actualiza el estado global
6. Usuario es redirigido a `/inicio`

### **3. Verificación de Sesión**
1. App se inicia
2. `useAuth` verifica localStorage
3. `authStorage.isSessionValid()` valida expiración
4. Si es válida: carga datos del usuario
5. Si no es válida: limpia y marca como no autenticado

### **4. Logout**
1. Usuario hace logout
2. `authStorage.clearSession()` limpia localStorage
3. `useAuth` actualiza estado a no autenticado
4. Usuario es redirigido a `/welcome`

---

## 🎯 **Mejores Prácticas Implementadas**

### **1. Separación de Responsabilidades**
- **authService**: Lógica de API y almacenamiento
- **useAuth**: Estado React y hooks
- **Componentes**: Solo UI y interacciones

### **2. Manejo de Errores**
- **Try-catch** en todas las operaciones de localStorage
- **Limpieza automática** de datos corruptos
- **Logs detallados** para debugging
- **Mensajes específicos** en cada campo de validación

### **3. Performance**
- **Validación eficiente** de expiración
- **Carga lazy** de datos de sesión
- **Memoización** en hooks con useCallback
- **Validación en tiempo real** sin interrupciones

### **4. Seguridad**
- **No almacenar contraseñas** en localStorage
- **Validación de tokens** en cada acceso
- **Limpieza automática** de sesiones expiradas
- **Headers seguros** en todas las peticiones

---

## 📊 **Beneficios del Sistema**

- ✅ **Persistencia**: Sesión se mantiene entre reinicios
- ✅ **Seguridad**: Validación automática de tokens
- ✅ **Performance**: Acceso rápido sin llamadas a servidor
- ✅ **UX**: Estado reactivo y carga automática
- ✅ **Mantenibilidad**: Código organizado y tipado
- ✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades
- ✅ **Validación**: Campos marcados en rojo con errores específicos
- ✅ **Flujo**: Interfaz intuitiva de múltiples pasos

---

## 🛡️ **Sistema de Protección de Rutas**

### **Rutas Públicas vs Protegidas**

#### **Rutas Públicas (No Requieren Autenticación)**
- `/welcome` - Página de bienvenida
- `/login` - Página de inicio de sesión
- `/register` - Página de registro
- `/2fa` - Verificación de dos factores
- `/location-permission` - Permisos de ubicación
- `/email-verification` - Verificación de email (futuro)
- `/email-confirmation` - Confirmación de email (futuro)
- `/forgot-password` - Recuperación de contraseña (futuro)
- `/reset-password` - Reset de contraseña (futuro)

#### **Rutas Protegidas (Requieren Autenticación)**
- `/inicio` - Página principal
- `/rutas` - Gestión de rutas
- `/en-vivo` - Seguimiento en vivo
- `/alertas` - Sistema de alertas
- `/perfil` - Perfil del usuario
- Cualquier otra ruta no listada como pública

### **Componente RouteGuard**

```typescript
// Protección automática de rutas
<RouteGuard>
  <IonTabs>
    {/* Todas las rutas aquí están protegidas */}
    <Route exact path="/inicio"><HomePage /></Route>
    <Route exact path="/rutas"><RoutesPage /></Route>
    <Route exact path="/en-vivo"><LivePage /></Route>
    <Route exact path="/alertas"><AlertsPage /></Route>
    <Route exact path="/perfil"><ProfilePage /></Route>
  </IonTabs>
</RouteGuard>
```

### **Flujo de Protección**

#### **Usuario No Autenticado Accede a Ruta Protegida**
1. **RouteGuard se monta** → Verifica estado de autenticación
2. **useAuth verifica localStorage** → Busca sesión válida
3. **No encuentra sesión válida** → `isAuthenticated = false`
4. **Redirige automáticamente** → A `/welcome`
5. **Usuario ve página de bienvenida** → Debe hacer login

#### **Usuario Autenticado Accede a Ruta Protegida**
1. **RouteGuard se monta** → Verifica estado de autenticación
2. **useAuth encuentra sesión válida** → `isAuthenticated = true`
3. **Renderiza contenido protegido** → Sin restricciones
4. **Usuario puede navegar** → A todas las rutas protegidas

### **Uso en Componentes**

```typescript
// Verificar si ruta es pública
import { isPublicRoute } from '../hooks/useRouteProtection';

if (isPublicRoute('/login')) {
  console.log('Ruta pública, acceso permitido');
}

// Usar hook de protección
import { useRouteProtection } from '../hooks/useRouteProtection';

function SomeComponent() {
  const { checkRouteAccess, isAuthenticated } = useRouteProtection();
  
  useEffect(() => {
    checkRouteAccess(window.location.pathname);
  }, []);

  return <div>Contenido del componente</div>;
}
```

---

## 🚀 **Próximos Pasos Sugeridos**

1. **Refresh Token**: Implementar renovación automática de tokens
2. **Secure Storage**: Migrar a almacenamiento nativo para datos ultra-sensibles
3. **Biometría**: Agregar autenticación biométrica
4. **Multi-sesión**: Soporte para múltiples usuarios
5. **Analytics**: Tracking de eventos de autenticación
6. **Verificación de Email**: Implementar flujo completo de confirmación
7. **Validación de Company Key**: Endpoint para verificar claves de organización
8. **Recuperación de Contraseña**: Implementar reset de contraseñas
9. **Autenticación Social**: Google y Microsoft (ya preparado en UI)
10. **2FA**: Autenticación de dos factores

---

## 📁 **Archivos del Sistema**

### **Autenticación**
- `src/services/authService.ts` - Servicio principal de autenticación
- `src/hooks/useAuth.ts` - Hook React para manejo de estado
- `src/pages/LoginPage.tsx` - Página de login integrada
- `src/pages/RegisterPage.tsx` - Página de registro con validación
- `src/pages/TwoFAPage.tsx` - Página de verificación de dos factores

### **Protección de Rutas**
- `src/components/RouteGuard.tsx` - Componente principal de protección
- `src/hooks/useRouteProtection.ts` - Hook y utilidades de protección
- `src/App.tsx` - Configuración de rutas protegidas

### **Componentes UI**
- `src/components/R2MInput.tsx` - Input con soporte para errores
- `src/components/R2MInput.css` - Estilos para campos con error
- `src/components/ErrorNotification.tsx` - Notificaciones de error integradas

---

## 🔍 **Debugging y Troubleshooting**

### **Variables de Entorno Faltantes**
```typescript
// Error: Variables de entorno faltantes
validateAuthConfig(); // Lanza error si faltan variables
```

### **Sesión Expirada**
```typescript
// Verificar si la sesión es válida
const isValid = authStorage.isSessionValid();
if (!isValid) {
  console.log('Sesión expirada, limpiando...');
}
```

### **Datos Corruptos en localStorage**
```typescript
// El sistema limpia automáticamente datos corruptos
try {
  const session = authStorage.getSession();
} catch (error) {
  // Se limpia automáticamente
}
```

---

*Sistema de autenticación completo implementado con las mejores prácticas para aplicaciones móviles Ionic.*
