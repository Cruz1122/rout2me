# Sistema de Colores - Route2Me Admin

Este archivo documenta la paleta de colores oficial de Route2Me y cómo utilizarla en la aplicación.

## Paleta de Colores

```css
--color-primary:   #163172  /* Azul oscuro principal */
--color-secondary: #1E56A0  /* Azul medio */
--color-terciary:  #97A3B1  /* Gris azulado */
--color-bg:        #F6F6F6  /* Fondo de página */
--color-surface:   #D6E4F0  /* Superficie clara */
--color-text:      #163172  /* Texto principal */
--color-accent:    #1E56A0  /* Acentos */
```

## Uso

### 1. En CSS (usando variables CSS)

```css
.mi-elemento {
  color: var(--color-primary);
  background-color: var(--color-surface);
  border-color: var(--color-secondary);
}
```

### 2. En TypeScript/React (usando el archivo colors.ts)

```typescript
import { colors, colorClasses } from '../styles/colors';

// Usando colores directos
<div style={{ backgroundColor: colors.primary }}>

// Usando clases de Tailwind
<button className={colorClasses.btnPrimary}>
  Botón Principal
</button>

<div className={colorClasses.bgSurface}>
  Contenido
</div>
```

## Clases Disponibles

### Fondos
- `colorClasses.bgPrimary` - Fondo azul oscuro (#163172)
- `colorClasses.bgSecondary` - Fondo azul medio (#1E56A0)
- `colorClasses.bgTerciary` - Fondo gris azulado (#97A3B1)
- `colorClasses.bgSurface` - Fondo superficie (#D6E4F0)
- `colorClasses.bgPage` - Fondo de página (#F6F6F6)

### Texto
- `colorClasses.textPrimary` - Texto principal (#163172)
- `colorClasses.textSecondary` - Texto secundario (#1E56A0)
- `colorClasses.textTerciary` - Texto terciario (#97A3B1)

### Bordes
- `colorClasses.borderPrimary` - Borde principal
- `colorClasses.borderSecondary` - Borde secundario
- `colorClasses.borderSurface` - Borde superficie

### Botones (con hover incluido)
- `colorClasses.btnPrimary` - Botón principal (azul oscuro)
- `colorClasses.btnSecondary` - Botón secundario (azul medio)
- `colorClasses.btnSurface` - Botón superficie (gris claro)

## Cambiar Colores Globalmente

Para cambiar los colores en toda la aplicación:

1. Edita el archivo `src/styles/colors.ts`
2. Actualiza los valores hexadecimales
3. Los cambios se aplicarán automáticamente en todos los componentes que usen el sistema

## Componentes Actualizados

Los siguientes componentes ya están usando el sistema de colores:
- ✅ Navbar (modal de logout, línea de navegación activa, botones)
- ✅ Sidebar (modal de logout, perfil de usuario, botón cerrar sesión)
- ✅ SignIn (botones, inputs, títulos, textos)
- ✅ SignUp (botones, inputs, títulos, textos)
- ✅ Vehicles (botón crear vehículo)
- ✅ HomePage (títulos, textos principales, KPIs, bordes, fondos)

## Próximos Pasos

Considera actualizar estos elementos para un mayor uso del sistema:
- [ ] Resto de gráficos y tablas en HomePage
- [ ] EmailVerified
- [ ] Inputs adicionales en formularios
