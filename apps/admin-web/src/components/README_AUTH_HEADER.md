# AuthHeader Component

Componente reutilizable para el header de las páginas de autenticación (SignIn y SignUp).

## Props

```typescript
interface AuthHeaderProps {
  readonly showSignUp?: boolean;
}
```

- **showSignUp** (opcional, default: `true`): 
  - `true`: Muestra el botón "Registrarse" que redirige a `/signup`
  - `false`: Muestra el botón "Iniciar Sesión" que redirige a `/signin`

## Características

- Logo de la aplicación (icon-metadata.webp) con filtro azul aplicado
- Título "Rout2Me Admin"
- Botón de navegación usando R2MButton (variant: secondary)
- Responsive y consistente con el diseño del sistema

## Uso

### En la página de SignIn (Iniciar Sesión)
```tsx
import AuthHeader from '../components/AuthHeader';

<AuthHeader showSignUp={true} />
```

### En la página de SignUp (Registro)
```tsx
import AuthHeader from '../components/AuthHeader';

<AuthHeader showSignUp={false} />
```

## Estilo

El componente usa:
- Borde inferior con color `#f0f2f4`
- Espaciado consistente (px-10 py-3)
- Logo con filtro CSS para convertirlo a color azul (#1E56A0)
- Tipografía Inter con peso bold
- colorClasses para colores consistentes del sistema
