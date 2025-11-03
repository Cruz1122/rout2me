# Configuración de Autenticación con Google OAuth

## ✅ Configuración Completada

Se ha configurado exitosamente la autenticación con Google usando Supabase OAuth.

## 📋 Componentes Creados/Modificados

### 1. **Cliente de Supabase** (`src/config/supabaseClient.ts`)
- Inicializa el cliente de Supabase con las credenciales de tu proyecto
- Configura el auto-refresh de tokens y la detección de sesiones en URLs

### 2. **Servicio de Autenticación** (`src/features/auth/services/authService.ts`)
- ✨ **Nueva función**: `loginWithGoogle()` - Inicia el flujo OAuth con Google
- ✨ **Nueva función**: `getCurrentSession()` - Obtiene la sesión actual de Supabase
- ✨ **Nueva función**: `convertSupabaseSessionToAuthSession()` - Convierte sesiones de OAuth a tu formato

### 3. **Manejador de OAuth** (`src/features/auth/components/OAuthHandler.tsx`)
- Componente que escucha cambios en el estado de autenticación
- Guarda automáticamente la sesión cuando el usuario se autentica con Google
- Redirige al usuario a `/inicio` después de un login exitoso

### 4. **LoginPage** (`src/features/auth/pages/LoginPage.tsx`)
- Conectado el botón de Google con la función `loginWithGoogle()`
- Maneja errores y estados de carga durante la autenticación

### 5. **App.tsx**
- Integrado el componente `OAuthHandler` para manejar callbacks de OAuth

### 6. **Variables de Entorno** (`.env`)
- Configuradas todas las variables necesarias para Supabase

## 🔧 Configuración en Supabase

### Callback URL Configurado
```
https://rcdsqsvfxyfnrueoovpy.supabase.co/auth/v1/callback
```

### Redirect URL después del Login
```
http://localhost:5173/inicio
```
*(o tu dominio de producción)*

## 🚀 Cómo Funciona

1. **Usuario hace clic en "Google"** en la página de login
2. Se llama a `loginWithGoogle()` que abre el flujo OAuth de Google
3. Usuario se autentica con su cuenta de Google
4. Google redirige de vuelta a Supabase callback
5. Supabase procesa la autenticación y redirige a tu app
6. `OAuthHandler` detecta la sesión nueva
7. Se convierte y guarda la sesión en localStorage
8. Usuario es redirigido a `/inicio`

## 🔐 Seguridad

- El token se almacena de forma segura en localStorage
- La sesión se refresca automáticamente antes de expirar
- Se verifica la validez de la sesión en cada carga de la app

## 📝 Notas Importantes

### Para Desarrollo Local
Asegúrate de agregar tu URL de desarrollo en Supabase:
1. Ve a Authentication → URL Configuration
2. Agrega `http://localhost:5173` a las "Redirect URLs"
3. Agrega `http://localhost:5173/**` a las "Site URLs"

### Para Producción
Cuando despliegues a producción:
1. Actualiza las Redirect URLs en Supabase con tu dominio
2. Considera usar variables de entorno específicas de producción

## 🎯 Próximos Pasos

- [ ] Probar el login con Google en desarrollo
- [ ] Configurar Microsoft OAuth (si es necesario)
- [ ] Agregar manejo de perfiles de usuario de OAuth
- [ ] Configurar redirect URLs para producción

## 🐛 Troubleshooting

### Si el login con Google no funciona:
1. Verifica que el provider de Google esté habilitado en Supabase
2. Confirma que el callback URL está correctamente configurado
3. Revisa la consola del navegador para errores
4. Verifica que las variables de entorno estén cargadas (`console.log(import.meta.env)`)

### Si no se guarda la sesión:
1. Verifica que `OAuthHandler` esté montado en `App.tsx`
2. Revisa la consola para ver los logs de "Auth state change"
3. Confirma que el localStorage no esté bloqueado
