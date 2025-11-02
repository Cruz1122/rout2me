# R2MModal y R2MFilterSwitcher - Componentes de Modal y Filtros

## R2MModal - Componente de Modal Reutilizable

### Descripción

`R2MModal` es un componente modal altamente reutilizable que proporciona una interfaz consistente para mostrar contenido en una ventana emergente. Incluye animaciones suaves, manejo de cierre y estructura flexible.

### Características

- **Backdrop con opacidad**: Fondo oscuro semitransparente
- **Cierre flexible**: Permite cerrar al hacer click fuera o con botón X
- **Tamaños configurables**: 5 tamaños predefinidos (sm, md, lg, xl, 2xl)
- **Header y Footer**: Estructura clara con título y área de acciones
- **Responsive**: Se adapta a pantallas móviles con max-w-[96%]
- **Animaciones**: Transiciones suaves al abrir/cerrar

### Props

```typescript
interface R2MModalProps {
  isOpen: boolean;                    // Estado de apertura del modal
  onClose: () => void;                // Función para cerrar el modal
  title: string;                      // Título del modal
  children: ReactNode;                // Contenido del modal
  footer?: ReactNode;                 // Contenido del footer (botones de acción)
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Ancho máximo (default: 'md')
  closeOnClickOutside?: boolean;      // Permite cerrar haciendo click fuera (default: true)
}
```

### Tamaños Disponibles

- **sm**: 384px (max-w-sm) - Alertas simples
- **md**: 448px (max-w-md) - Diálogos estándar
- **lg**: 512px (max-w-lg) - Formularios medianos
- **xl**: 576px (max-w-xl) - Formularios grandes
- **2xl**: 672px (max-w-2xl) - Contenido extenso

### Uso Básico

```tsx
import R2MModal from '../components/R2MModal';
import R2MButton from '../components/R2MButton';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <R2MButton onClick={() => setIsOpen(true)}>
        Abrir Modal
      </R2MButton>

      <R2MModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mi Modal"
        maxWidth="lg"
      >
        <p>Contenido del modal aquí...</p>
      </R2MModal>
    </>
  );
}
```

### Ejemplo con Footer

```tsx
<R2MModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmar Acción"
  maxWidth="md"
  footer={
    <div className="flex gap-3 justify-end">
      <R2MButton variant="ghost" onClick={handleClose}>
        Cancelar
      </R2MButton>
      <R2MButton variant="primary" onClick={handleConfirm}>
        Confirmar
      </R2MButton>
    </div>
  }
>
  <p>¿Estás seguro de que deseas continuar?</p>
</R2MModal>
```

### Ejemplo con Formulario

```tsx
<R2MModal
  isOpen={isModalOpen}
  onClose={closeModal}
  title="Crear Usuario"
  maxWidth="lg"
  closeOnClickOutside={false}  // Prevenir cierre accidental
  footer={
    <div className="flex gap-3 justify-end">
      <R2MButton variant="ghost" onClick={closeModal}>
        Cancelar
      </R2MButton>
      <R2MButton 
        variant="secondary" 
        loading={isSubmitting}
        onClick={handleSubmit}
      >
        Guardar
      </R2MButton>
    </div>
  }
>
  <div className="space-y-4">
    <div>
      <label className="flex flex-col">
        <span className="text-base font-medium pb-2">Nombre</span>
        <input 
          type="text"
          className="..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
    </div>
    {/* Más campos... */}
  </div>
</R2MModal>
```

---

## R2MFilterSwitcher - Componente de Filtros

### Descripción

`R2MFilterSwitcher` es un componente de filtros estilo "segmented control" que permite seleccionar entre múltiples opciones. Inspirado en el FilterSwitcher de passenger-app pero adaptado para usar Remix Icons.

### Características

- **Selección única**: Solo una opción activa a la vez
- **Deselección opcional**: Permite volver a null si `allowDeselect` está activo
- **Iconos opcionales**: Soporte para iconos de Remix Icon
- **Animaciones**: Transición suave entre estados
- **Diseño responsive**: Se adapta al contenedor padre

### Props

```typescript
interface FilterOption<T extends string> {
  id: T;              // ID único del filtro
  label: string;      // Texto a mostrar
  icon?: string;      // Clase de icono de Remix Icon (opcional)
}

interface R2MFilterSwitcherProps<T extends string> {
  options: readonly FilterOption<T>[];  // Opciones disponibles
  activeFilter: T | null;                // Filtro actualmente activo
  onFilterChange: (filter: T | null) => void;  // Callback al cambiar filtro
  allowDeselect?: boolean;               // Permite deseleccionar (default: false)
}
```

### Uso Básico

```tsx
import R2MFilterSwitcher from '../components/R2MFilterSwitcher';

type StatusFilter = 'active' | 'inactive' | 'pending';

function MyComponent() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  return (
    <R2MFilterSwitcher
      options={[
        { id: 'active', label: 'Activos', icon: 'ri-checkbox-circle-line' },
        { id: 'inactive', label: 'Inactivos', icon: 'ri-close-circle-line' },
        { id: 'pending', label: 'Pendientes', icon: 'ri-time-line' },
      ]}
      activeFilter={statusFilter}
      onFilterChange={(filter) => setStatusFilter(filter as StatusFilter)}
    />
  );
}
```

### Ejemplo con Deselección

```tsx
<R2MFilterSwitcher
  options={[
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mes' },
  ]}
  activeFilter={dateFilter}
  onFilterChange={setDateFilter}
  allowDeselect={true}  // Permite volver a null
/>
```

### Ejemplo en Formulario (Estados de Vehículo)

```tsx
<div>
  <p className="text-[#111317] text-base font-medium pb-2">
    Estado del Vehículo
  </p>
  <R2MFilterSwitcher
    options={[
      { 
        id: 'AVAILABLE', 
        label: 'Disponible', 
        icon: 'ri-checkbox-circle-line' 
      },
      { 
        id: 'IN_SERVICE', 
        label: 'En Servicio', 
        icon: 'ri-steering-2-line' 
      },
      { 
        id: 'MAINTENANCE', 
        label: 'Mantenimiento', 
        icon: 'ri-tools-line' 
      },
      { 
        id: 'OUT_OF_SERVICE', 
        label: 'Fuera de Servicio', 
        icon: 'ri-close-circle-line' 
      },
    ]}
    activeFilter={status}
    onFilterChange={(filter) => setStatus(filter as VehicleStatus)}
    allowDeselect={false}
  />
</div>
```

### Ejemplo sin Iconos

```tsx
<R2MFilterSwitcher
  options={[
    { id: 'all', label: 'Todos' },
    { id: 'completed', label: 'Completados' },
    { id: 'cancelled', label: 'Cancelados' },
  ]}
  activeFilter={tripFilter}
  onFilterChange={setTripFilter}
/>
```

---

## Combinando R2MModal con R2MFilterSwitcher

### Ejemplo Completo: Modal de Filtros Avanzados

```tsx
<R2MModal
  isOpen={isFilterModalOpen}
  onClose={() => setIsFilterModalOpen(false)}
  title="Filtros Avanzados"
  maxWidth="lg"
  footer={
    <div className="flex gap-3 justify-end">
      <R2MButton variant="ghost" onClick={resetFilters}>
        Limpiar
      </R2MButton>
      <R2MButton variant="primary" onClick={applyFilters}>
        Aplicar Filtros
      </R2MButton>
    </div>
  }
>
  <div className="space-y-4">
    <div>
      <p className="text-base font-medium pb-2">Estado</p>
      <R2MFilterSwitcher
        options={statusOptions}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />
    </div>

    <div>
      <p className="text-base font-medium pb-2">Tipo</p>
      <R2MFilterSwitcher
        options={typeOptions}
        activeFilter={typeFilter}
        onFilterChange={setTypeFilter}
        allowDeselect={true}
      />
    </div>
  </div>
</R2MModal>
```

---

## Iconos Recomendados (Remix Icon)

### Estados Generales
- `ri-checkbox-circle-line` - Activo/Disponible
- `ri-close-circle-line` - Inactivo/Cerrado
- `ri-time-line` - Pendiente/En Espera
- `ri-alert-line` - Advertencia

### Vehículos
- `ri-steering-2-line` - En Servicio
- `ri-tools-line` - Mantenimiento
- `ri-car-line` - Vehículo General

### Fechas
- `ri-calendar-line` - Fecha
- `ri-calendar-today-line` - Hoy
- `ri-calendar-week-line` - Semana

### Más iconos en: [Remix Icon](https://remixicon.com/)

---

## Mejores Prácticas

### R2MModal

1. **Usa `closeOnClickOutside={false}`** para formularios importantes
2. **Incluye siempre un footer** con al menos un botón de acción
3. **Mantén el contenido organizado** usando `space-y-4` en el children
4. **Usa tamaños apropiados**: `md` para diálogos, `lg` para formularios
5. **Maneja estados de carga** en los botones del footer

### R2MFilterSwitcher

1. **Máximo 4-5 opciones** para mantener legibilidad
2. **Usa iconos consistentes** para mejorar reconocimiento visual
3. **Labels concisos**: Mantén el texto corto (1-2 palabras)
4. **Considera `allowDeselect`** si "ningún filtro" es válido
5. **Type safety**: Usa tipos específicos para el ID del filtro

---

## Accesibilidad

- **R2MModal**: Botón de cierre con `aria-label`, backdrop con tabIndex=-1
- **R2MFilterSwitcher**: Usa radio buttons ocultos para accesibilidad nativa
- Navegación por teclado funcional en ambos componentes
- Estados visuales claros para lectores de pantalla
