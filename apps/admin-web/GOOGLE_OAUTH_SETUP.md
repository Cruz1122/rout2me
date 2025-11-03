# Configuración de Google OAuth con Supabase

## 1. Configuración en Google Cloud Console

### 1.1. Crear credenciales OAuth 2.0

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Si es la primera vez, configura la **OAuth consent screen**:
   - Tipo: External
   - App name: Rout2Me Admin
   - User support email: tu email
   - Developer contact: tu email
   - Guarda y continúa
   - En **Test users**, agrega los emails que podrán probar la app

### 1.2. Configurar OAuth Client

**Application type**: Web application

**Authorized JavaScript origins** (agregar ambos):
```
http://localhost:5173
https://rcdsqsvfxyfnrueoovpy.supabase.co
```

**Authorized redirect URIs**:
```
https://rcdsqsvfxyfnrueoovpy.supabase.co/auth/v1/callback
```

Después de crear, copia:
- **Client ID**
- **Client Secret**

---

## 2. Configuración en Supabase Dashboard

### 2.1. Habilitar el proveedor Google

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Navega a **Authentication** > **Providers**
3. Busca **Google** y haz clic para configurar
4. Habilita el proveedor (toggle ON)
5. Pega:
   - **Client ID**: el Client ID de Google
   - **Client Secret**: el Client Secret de Google
6. Guarda los cambios

### 2.2. Configurar URLs

En **Authentication** > **URL Configuration**:

**Site URL**: `http://localhost:5173` (desarrollo) o tu dominio de producción

**Redirect URLs** (agregar):
```
http://localhost:5173/auth/callback
http://localhost:5173/**
```

---

## 3. Configuración en el Frontend

### 3.1. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (ya existe `.env.example` como referencia):

```env
VITE_SUPABASE_URL=https://rcdsqsvfxyfnrueoovpy.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_SITE_URL=http://localhost:5173
```

### 3.2. Archivos ya configurados

Los siguientes archivos ya están configurados:

- ✅ `src/lib/supabase.ts` - Cliente de Supabase con OAuth habilitado
- ✅ `src/api/auth_api.ts` - Función `signInWithGoogle()`
- ✅ `src/pages/SignIn.tsx` - Botón "Continuar con Google"
- ✅ `src/pages/SignUp.tsx` - Botón "Continuar con Google"
- ✅ `src/pages/AuthCallback.tsx` - Manejo del callback OAuth

---

## 4. Flujo de autenticación

### 4.1. Inicio de sesión / Registro

1. Usuario hace clic en "Continuar con Google"
2. Se abre popup de Google para seleccionar cuenta
3. Usuario autoriza la aplicación
4. Google redirige a: `https://rcdsqsvfxyfnrueoovpy.supabase.co/auth/v1/callback`
5. Supabase procesa y redirige a: `http://localhost:5173/auth/callback?code=...`
6. `AuthCallback.tsx` intercambia el código por una sesión
7. Se guarda el usuario en localStorage y contexto
8. Redirige a `/home`

### 4.2. Datos del usuario

Cuando un usuario se registra con Google, se obtiene automáticamente:
- `email`: Email de Google
- `name`: Nombre completo de la cuenta de Google (de `user_metadata`)
- `id`: ID único generado por Supabase
- `phone`: Vacío (no se obtiene de Google por defecto)

---

## 5. Testing

### 5.1. Agregar usuarios de prueba

Mientras tu app esté en modo "Testing" en Google:

1. Ve a **OAuth consent screen**
2. En **Test users**, agrega los emails que podrán probar
3. Solo esos usuarios podrán iniciar sesión

### 5.2. Publicar la app (opcional)

Para permitir cualquier cuenta de Google:

1. Ve a **OAuth consent screen**
2. Haz clic en **PUBLISH APP**
3. Google puede requerir verificación si solicitas scopes sensibles

---

## 6. Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa**: La URL de callback no coincide con las configuradas en Google Cloud Console.

**Solución**: Verifica que en Google Cloud Console tengas exactamente:
```
https://rcdsqsvfxyfnrueoovpy.supabase.co/auth/v1/callback
```

### Error: "origin_mismatch"

**Causa**: El origen de la petición no está autorizado.

**Solución**: En **Authorized JavaScript origins**, agrega:
```
http://localhost:5173
https://rcdsqsvfxyfnrueoovpy.supabase.co
```

### Error: "Access blocked: This app's request is invalid"

**Causa**: La app está en modo Testing y el usuario no está en la lista de test users.

**Solución**: Agrega el email del usuario en **OAuth consent screen** > **Test users**.

### El usuario se crea pero no tiene nombre

**Causa**: Google no proporcionó el nombre en los metadatos.

**Solución**: El código ya maneja esto usando el email como fallback:
```typescript
name: user.user_metadata?.name || user.user_metadata?.full_name || user.email
```

---

## 7. Producción

Cuando despliegues a producción:

1. **Google Cloud Console**:
   - Agrega tu dominio de producción a **Authorized JavaScript origins**
   - Actualiza **Authorized redirect URIs** si cambió el dominio de Supabase

2. **Supabase**:
   - Actualiza **Site URL** con tu dominio de producción
   - Agrega tu dominio a **Redirect URLs**

3. **Frontend**:
   - Actualiza `VITE_SITE_URL` en las variables de entorno de producción

---

## 8. Estructura del código

### `src/lib/supabase.ts`
Cliente de Supabase configurado con:
- `persistSession: true` - Mantiene la sesión activa
- `autoRefreshToken: true` - Renueva el token automáticamente
- `detectSessionInUrl: true` - Detecta sesiones en la URL (para callbacks)

### `src/api/auth_api.ts`
Función `signInWithGoogle()`:
```typescript
export async function signInWithGoogle(): Promise<void> {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al iniciar sesión con Google');
  }
}
```

### `src/pages/AuthCallback.tsx`
Maneja el callback OAuth:
1. Detecta el parámetro `code` en la URL
2. Llama a `supabase.auth.exchangeCodeForSession(code)`
3. Guarda la sesión en localStorage y contexto
4. Redirige a `/home`

---

## Resumen de URLs importantes

| Tipo | URL |
|------|-----|
| **Google OAuth Redirect** | `https://rcdsqsvfxyfnrueoovpy.supabase.co/auth/v1/callback` |
| **App Callback** | `http://localhost:5173/auth/callback` |
| **Site URL** | `http://localhost:5173` |
| **JavaScript Origins** | `http://localhost:5173`<br>`https://rcdsqsvfxyfnrueoovpy.supabase.co` |

---

¡Listo! Ahora tu aplicación soporta inicio de sesión y registro con Google. 🎉
