# R2MButton - Componente de Botón Reutilizable

## Descripción

`R2MButton` es un componente de botón altamente reutilizable y personalizable que utiliza la paleta de colores de Rout2Me. Incluye múltiples variantes de color, tamaños, soporte para iconos, estados de carga y animaciones elegantes.

## Características

- **7 Variantes de Color**: Primary (azul oscuro), Secondary (azul medio), Success (verde), Danger (rojo), Warning (amarillo), Surface (azul claro), Ghost (transparente)
- **3 Tamaños**: Small, Medium, Large
- **Estado de Carga**: Muestra un spinner animado cuando está en estado de carga
- **Soporte para Iconos**: Posibilidad de agregar iconos de Remix Icon a la izquierda o derecha del texto
- **Animaciones Elegantes**: 
  - Hover: Escala sutil y sombra
  - Click: Efecto de presión (scale down)
  - Loading: Spinner rotatorio suave
- **Accesibilidad**: Focus ring visible, estados deshabilitados claros

## Props

```typescript
interface R2MButtonProps {
  children: React.ReactNode;           // Contenido del botón
  onClick?: () => void;                 // Función al hacer click
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'surface' | 'ghost'; // Variante de color (default: 'primary')
  size?: 'sm' | 'md' | 'lg';           // Tamaño del botón (default: 'md')
  disabled?: boolean;                   // Estado deshabilitado (default: false)
  loading?: boolean;                    // Estado de carga (default: false)
  fullWidth?: boolean;                  // Ancho completo (default: false)
  icon?: string;                        // Clase de icono de Remix Icon (ej: 'ri-add-line')
  iconPosition?: 'left' | 'right';     // Posición del icono (default: 'left')
  type?: 'button' | 'submit' | 'reset'; // Tipo de botón HTML (default: 'button')
  className?: string;                   // Clases CSS adicionales
}
```

## Uso Básico

```tsx
import R2MButton from '../components/R2MButton';

// Botón básico
<R2MButton onClick={handleClick}>
  Aceptar
</R2MButton>

// Botón con variante
<R2MButton variant="success" onClick={handleSave}>
  Guardar
</R2MButton>

// Botón con icono
<R2MButton 
  variant="primary" 
  icon="ri-add-line" 
  iconPosition="left"
  onClick={handleAdd}
>
  Agregar Nuevo
</R2MButton>

// Botón con estado de carga
<R2MButton 
  variant="secondary" 
  loading={isLoading}
  onClick={handleSubmit}
>
  Enviar
</R2MButton>

// Botón deshabilitado
<R2MButton disabled>
  No Disponible
</R2MButton>

// Botón de ancho completo
<R2MButton fullWidth variant="primary">
  Continuar
</R2MButton>
```

## Ejemplos por Variante

### Primary (Azul Oscuro #163172)
```tsx
<R2MButton variant="primary" icon="ri-save-line">
  Guardar Cambios
</R2MButton>
```
- **Uso**: Acciones principales, confirmaciones importantes

### Secondary (Azul Medio #1E56A0)
```tsx
<R2MButton variant="secondary" icon="ri-add-circle-line">
  Crear Nuevo
</R2MButton>
```
- **Uso**: Acciones secundarias importantes

### Success (Verde)
```tsx
<R2MButton variant="success" icon="ri-check-line">
  Confirmar
</R2MButton>
```
- **Uso**: Confirmaciones exitosas, aprobaciones

### Danger (Rojo)
```tsx
<R2MButton variant="danger" icon="ri-delete-bin-line">
  Eliminar
</R2MButton>
```
- **Uso**: Acciones destructivas, eliminaciones

### Warning (Amarillo)
```tsx
<R2MButton variant="warning" icon="ri-alert-line">
  Advertencia
</R2MButton>
```
- **Uso**: Advertencias, acciones que requieren atención

### Surface (Azul Claro #D6E4F0)
```tsx
<R2MButton variant="surface" icon="ri-add-line">
  Agregar Item
</R2MButton>
```
- **Uso**: Acciones menos prominentes, botones de formulario

### Ghost (Transparente)
```tsx
<R2MButton variant="ghost">
  Cancelar
</R2MButton>
```
- **Uso**: Cancelaciones, acciones terciarias, botones de cierre

## Ejemplos por Tamaño

### Small
```tsx
<R2MButton size="sm" icon="ri-edit-line">
  Editar
</R2MButton>
```
- **Altura**: 32px (h-8)
- **Padding**: 12px horizontal (px-3)
- **Texto**: Extra pequeño (text-xs)

### Medium (Default)
```tsx
<R2MButton size="md" icon="ri-save-line">
  Guardar
</R2MButton>
```
- **Altura**: 40px (h-10)
- **Padding**: 16px horizontal (px-4)
- **Texto**: Pequeño (text-sm)

### Large
```tsx
<R2MButton size="lg" icon="ri-check-line">
  Confirmar
</R2MButton>
```
- **Altura**: 48px (h-12)
- **Padding**: 24px horizontal (px-6)
- **Texto**: Base (text-base)

## Animaciones

### Hover
- **Escala**: Sutil aumento de sombra
- **Duración**: 200ms ease-out
- **Icono**: Escala 110% del icono

### Click (Active)
- **Escala**: 98% (efecto de presión)
- **Transición**: Instantánea al hacer click

### Loading
- **Spinner**: Rotación continua de 360° en 0.6s
- **Estado**: El botón está deshabilitado mientras carga

## Estados

### Deshabilitado
```tsx
<R2MButton disabled>
  Botón Deshabilitado
</R2MButton>
```
- Opacidad reducida (50%)
- Cursor not-allowed
- Sin interacción

### Cargando
```tsx
<R2MButton loading>
  Procesando...
</R2MButton>
```
- Muestra spinner animado
- Oculta icono temporalmente
- Botón deshabilitado automáticamente

## Uso con Formularios

```tsx
<form onSubmit={handleSubmit}>
  <input type="text" />
  
  <div className="flex gap-3 justify-end">
    <R2MButton 
      variant="ghost" 
      type="button"
      onClick={handleCancel}
    >
      Cancelar
    </R2MButton>
    
    <R2MButton 
      variant="primary" 
      type="submit"
      loading={isSubmitting}
      icon="ri-save-line"
    >
      Guardar
    </R2MButton>
  </div>
</form>
```

## Clases Personalizadas

Puedes agregar clases CSS adicionales usando la prop `className`:

```tsx
<R2MButton 
  className="!w-8 !h-8 !p-0 !min-w-0"
  variant="ghost"
  icon="ri-close-line"
>
  <span className="sr-only">Cerrar</span>
</R2MButton>
```

**Nota**: Usa `!` (important) para sobrescribir estilos predeterminados.

## Accesibilidad

- **Focus Ring**: Anillo de enfoque de 2px visible al navegar con teclado
- **Screen Reader**: Compatible con lectores de pantalla
- **Estados Claros**: Estados visuales distintos para hover, active, disabled

## Mejores Prácticas

1. **Usa variantes apropiadas**: Primary para acciones principales, Danger para eliminaciones
2. **Incluye iconos descriptivos**: Los iconos ayudan a la comprensión visual
3. **Estados de carga**: Siempre usa `loading` en operaciones asíncronas
4. **Botones de cancelación**: Usa variant `ghost` para botones de cancelación
5. **Ancho completo**: Usa `fullWidth` en formularios para mejor UX móvil

## Combinación con R2MActionIconButton

Para acciones en tablas o listados, usa `R2MActionIconButton` (solo icono + tooltip). Para formularios y modales, usa `R2MButton` (texto + icono opcional).

```tsx
// En tablas
<R2MActionIconButton 
  icon="ri-delete-bin-line"
  label="Eliminar"
  variant="danger"
  onClick={handleDelete}
/>

// En modales
<R2MButton 
  variant="danger"
  icon="ri-delete-bin-line"
  onClick={handleDelete}
>
  Eliminar
</R2MButton>
```

## Paleta de Colores Rout2Me

- **Primary**: #163172 (Azul Oscuro)
- **Secondary**: #1E56A0 (Azul Medio)
- **Terciary**: #97A3B1 (Gris)
- **Background**: #F6F6F6 (Gris Claro)
- **Surface**: #D6E4F0 (Azul Claro)

## Iconos Disponibles

Usa cualquier icono de [Remix Icon](https://remixicon.com/):
- `ri-add-line` - Agregar
- `ri-save-line` - Guardar
- `ri-delete-bin-line` - Eliminar
- `ri-edit-line` - Editar
- `ri-check-line` - Confirmar
- `ri-close-line` - Cerrar
- `ri-arrow-right-line` - Siguiente
- `ri-arrow-left-line` - Anterior
- Y muchos más...
