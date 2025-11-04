# Sistema de Caché de Avatares

## Descripción

El sistema de caché de avatares permite almacenar localmente las fotos de perfil de los usuarios para mejorar el rendimiento y reducir las peticiones al servidor.

## Características

- ✅ **Caché automático**: Las imágenes se guardan automáticamente en localStorage
- ✅ **Fallback inteligente**: Si la imagen falla al cargar, muestra un ícono por defecto
- ✅ **Expiración de caché**: Las imágenes se mantienen por 7 días
- ✅ **Limpieza automática**: Elimina cachés antiguos al cargar el componente
- ✅ **Manejo de errores**: Si la petición falla, no afecta la experiencia del usuario

## Componente R2MAvatar

### Uso básico

```tsx
import R2MAvatar from '../../../shared/components/R2MAvatar';

function ProfilePage() {
  const avatarUrl = 'https://example.com/avatar.jpg';
  const userName = 'Juan Pérez';

  return (
    <R2MAvatar
      avatarUrl={avatarUrl}
      userName={userName}
      size={64}
      iconSize={32}
    />
  );
}
```

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `avatarUrl` | `string \| null \| undefined` | - | URL de la imagen del avatar |
| `userName` | `string` | `'Usuario'` | Nombre del usuario (usado para el alt de la imagen) |
| `size` | `number` | `64` | Tamaño del avatar en píxeles |
| `iconSize` | `number` | `32` | Tamaño del ícono por defecto en píxeles |

## Servicio avatarCacheService

### Funciones disponibles

#### `saveAvatarToCache(url: string, blob: Blob): Promise<void>`
Guarda una imagen en el caché local.

```tsx
const response = await fetch(avatarUrl);
const blob = await response.blob();
await saveAvatarToCache(avatarUrl, blob);
```

#### `getAvatarFromCache(url: string): string | null`
Recupera una imagen del caché. Retorna `null` si no existe o expiró.

```tsx
const cachedAvatar = getAvatarFromCache(avatarUrl);
if (cachedAvatar) {
  // Usar imagen cacheada
}
```

#### `cleanOldAvatarCache(): void`
Limpia todas las imágenes que tienen más de 7 días.

```tsx
cleanOldAvatarCache();
```

#### `removeAvatarFromCache(url: string): void`
Elimina una imagen específica del caché.

```tsx
removeAvatarFromCache(avatarUrl);
```

#### `clearAllAvatarCache(): void`
Limpia completamente el caché de avatares.

```tsx
clearAllAvatarCache();
```

## Flujo de funcionamiento

1. **Primera carga**: Se descarga la imagen desde el servidor y se guarda en localStorage
2. **Cargas posteriores**: Se usa la imagen cacheada sin hacer peticiones al servidor
3. **Error de carga**: Se muestra el ícono por defecto (`RiUser5Fill`)
4. **Expiración**: Después de 7 días, se vuelve a descargar la imagen

## Consideraciones

- El caché usa localStorage, que tiene un límite de ~5-10MB dependiendo del navegador
- Las imágenes se almacenan como Base64, lo que aumenta su tamaño ~33%
- Si el localStorage está lleno, las operaciones de caché fallarán silenciosamente sin afectar la UX
- El servicio limpia automáticamente cachés antiguos para liberar espacio

## Ejemplo completo

```tsx
import { useState, useEffect } from 'react';
import R2MAvatar from '../../../shared/components/R2MAvatar';
import { getUserInfo } from '../services/userService';

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const data = await getUserInfo(accessToken);
      setUserInfo(data);
    };
    loadUser();
  }, []);

  if (!userInfo) return <div>Cargando...</div>;

  const avatarUrl = userInfo.user_metadata?.avatar_url || 
                    userInfo.user_metadata?.picture;

  return (
    <div>
      <R2MAvatar
        avatarUrl={avatarUrl}
        userName={userInfo.user_metadata?.name}
        size={64}
        iconSize={32}
      />
      <h2>{userInfo.user_metadata?.name}</h2>
    </div>
  );
}
```
