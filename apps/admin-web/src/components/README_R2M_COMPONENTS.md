# Componentes Reutilizables R2M

Este documento describe los componentes reutilizables creados para el sistema Rout2Me.

## R2MDetailDisplay

Componente para mostrar detalles de cualquier entidad en formato clave-valor.

### Características

- **Truncamiento inteligente**: Los valores largos (como IDs) se truncan automáticamente con "..."
- **Copiado al portapapeles**: Los IDs largos incluyen un botón para copiar el valor completo
- **Estados de carga**: Muestra un spinner mientras se cargan los datos
- **Mensaje vacío personalizable**: Permite personalizar el mensaje cuando no hay datos
- **Diseño consistente**: Mantiene el estilo visual de la aplicación

### Props

```typescript
interface DetailItem {
  label: string;                        // Etiqueta del campo
  value: string | number | null;        // Valor a mostrar
  type?: 'text' | 'id' | 'status' | 'location' | 'time'; // Tipo de dato (opcional)
  maxLength?: number;                   // Longitud máxima antes de truncar
  copyable?: boolean;                   // Si se puede copiar el valor completo
}

interface R2MDetailDisplayProps {
  items: DetailItem[];                  // Array de items a mostrar
  loading?: boolean;                    // Estado de carga
  emptyMessage?: string;                // Mensaje cuando no hay datos
}
```

### Ejemplo de uso

```tsx
import R2MDetailDisplay, { type DetailItem } from '../components/R2MDetailDisplay';

function MyComponent() {
  const detailItems: DetailItem[] = [
    {
      label: 'ID',
      value: 'abc123def456ghi789jkl012mno345',
      type: 'id',
      maxLength: 20,
      copyable: true,
    },
    {
      label: 'Nombre',
      value: 'John Doe',
      type: 'text',
    },
    {
      label: 'Estado',
      value: 'Activo',
      type: 'status',
    },
  ];

  return (
    <R2MDetailDisplay
      items={detailItems}
      loading={false}
      emptyMessage="No hay datos disponibles"
    />
  );
}
```

### Comportamiento del truncamiento

- Si `maxLength` está definido y el valor excede esa longitud:
  - El valor se muestra truncado con "..." al final
  - Si `copyable` es `true`, aparece un botón de copiar
- Al hacer clic en el botón de copiar:
  - Se copia el valor completo al portapapeles
  - El icono cambia temporalmente a un checkmark verde
  - Después de 2 segundos, vuelve al icono de copiar

---

## R2MActionButtons

Componente para mostrar botones de acción de manera consistente.

### Características

- **Múltiples variantes**: primary, secondary, danger, warning, success
- **Estados de carga**: Muestra un spinner cuando una acción está en progreso
- **Estados deshabilitados**: Manejados automáticamente con estilos apropiados
- **Orientación flexible**: Vertical u horizontal
- **Iconos opcionales**: Soporta iconos personalizados
- **Diseño responsivo**: Se adapta al contenedor

### Props

```typescript
interface ActionButton {
  label: string;                        // Texto del botón
  onClick: () => void;                  // Función al hacer clic
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  disabled?: boolean;                   // Si el botón está deshabilitado
  loading?: boolean;                    // Si está en proceso de carga
  icon?: React.ReactNode;               // Icono opcional
}

interface R2MActionButtonsProps {
  readonly actions: ActionButton[];     // Array de acciones
  readonly orientation?: 'vertical' | 'horizontal';
  readonly className?: string;          // Clases CSS adicionales
}
```

### Variantes de color

- **primary**: Azul (acciones principales)
- **secondary**: Gris claro (acciones secundarias)
- **danger**: Rojo (acciones destructivas)
- **warning**: Naranja (acciones que requieren precaución)
- **success**: Verde (acciones de confirmación)

### Ejemplo de uso

```tsx
import R2MActionButtons, { type ActionButton } from '../components/R2MActionButtons';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  const actions: ActionButton[] = [
    {
      label: 'Guardar',
      onClick: handleSave,
      variant: 'primary',
      loading: loading,
    },
    {
      label: 'Cancelar',
      onClick: handleCancel,
      variant: 'secondary',
    },
    {
      label: 'Eliminar',
      onClick: handleDelete,
      variant: 'danger',
      disabled: !canDelete,
    },
  ];

  return (
    <R2MActionButtons
      actions={actions}
      orientation="vertical"
      className="px-4 py-3"
    />
  );
}
```

---

## Integración en Vehicles

Los componentes se utilizan en la página de Vehículos para:

1. **Mostrar detalles del vehículo**: IDs largos se truncan y pueden copiarse
2. **Acciones contextuales**: Los botones cambian según el estado del vehículo
   - Si tiene ruta asignada: "Cambiar Ruta" y "Remover Ruta"
   - Si no tiene ruta: "Asignar Ruta"
   - Siempre disponible: "Eliminar"

### Ejemplo de integración

```tsx
function VehiclesPage() {
  // ... lógica del componente ...

  function getVehicleDetailItems(vehicle: Vehicle | null): DetailItem[] {
    if (!vehicle) return [];
    
    return [
      {
        label: 'ID del Vehículo',
        value: vehicle.id,
        type: 'id',
        maxLength: 20,
        copyable: true,
      },
      // ... más items ...
    ];
  }

  function getVehicleActions(vehicle: Vehicle | null): ActionButton[] {
    if (!vehicle) return [];
    
    const actions: ActionButton[] = [];
    
    if (vehicle.active_route_variant_id) {
      actions.push({
        label: 'Cambiar Ruta',
        onClick: openRouteModal,
        variant: 'primary',
      });
    } else {
      actions.push({
        label: 'Asignar Ruta',
        onClick: openRouteModal,
        variant: 'success',
      });
    }
    
    return actions;
  }

  return (
    <>
      <R2MDetailDisplay
        items={getVehicleDetailItems(selectedVehicle)}
        loading={loadingVehicles}
        emptyMessage="Selecciona un vehículo para ver sus detalles"
      />
      
      <R2MActionButtons
        actions={getVehicleActions(selectedVehicle)}
        orientation="vertical"
      />
    </>
  );
}
```

---

## Beneficios

1. **Reutilizable**: Ambos componentes pueden usarse en cualquier página del admin
2. **Consistente**: Mantienen el mismo estilo visual en toda la aplicación
3. **Mantenible**: Cambios en un solo lugar se reflejan en toda la app
4. **Tipado fuerte**: TypeScript garantiza el uso correcto
5. **Accesible**: Incluye feedback visual para todas las interacciones
6. **UX mejorada**: Funcionalidad de copiado para IDs largos

---

## Futuras mejoras

- [ ] Añadir tooltips para valores truncados
- [ ] Soporte para ordenamiento de items
- [ ] Temas personalizables
- [ ] Animaciones de entrada/salida
- [ ] Soporte para grupos de detalles colapsables
