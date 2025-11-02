# Componentes R2M de Tabla

Documentación de los componentes reutilizables de tabla creados para Rout2Me.

## R2MTable

Componente de tabla reutilizable con ordenamiento, paginación y acciones integradas.

### Características

✨ **Ordenamiento por columna**: Click en headers para ordenar (asc/desc/sin orden)
📄 **Paginación integrada**: Control completo de filas por página
🎨 **Paleta Rout2Me**: Usa los colores corporativos de la aplicación
⚡ **Carga optimizada**: Estado de loading integrado
🔍 **Búsqueda externa**: Compatible con filtros externos
🎯 **Acciones personalizables**: Columna de acciones flexible
📱 **Responsive**: Diseño adaptativo

### Props

```typescript
interface R2MTableProps<T> {
  readonly data: T[];                          // Datos a mostrar
  readonly columns: R2MTableColumn<T>[];       // Definición de columnas
  readonly loading?: boolean;                  // Estado de carga
  readonly emptyMessage?: string;              // Mensaje cuando no hay datos
  readonly onRowClick?: (item: T) => void;     // Callback al hacer click en fila
  readonly getRowKey: (item: T) => string;     // Función para obtener key única
  readonly defaultRowsPerPage?: number;        // Filas por defecto (default: 5)
  readonly rowsPerPageOptions?: number[];      // Opciones de paginación
  readonly actions?: (item: T) => React.ReactNode; // Renderizar acciones
}

interface R2MTableColumn<T> {
  key: string;                                 // Key de la propiedad
  header: string;                              // Texto del header
  sortable?: boolean;                          // Si se puede ordenar
  width?: string;                              // Ancho de columna
  className?: string;                          // Clases CSS adicionales
  render?: (item: T) => React.ReactNode;       // Renderizado personalizado
}
```

### Ejemplo de Uso

```tsx
import R2MTable, { type R2MTableColumn } from '../components/R2MTable';
import R2MActionIconButton from '../components/R2MActionIconButton';

interface Vehicle {
  id: string;
  plate: string;
  status: string;
  speed_kph: number | null;
}

function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  // Definir columnas
  const columns: R2MTableColumn<Vehicle>[] = [
    {
      key: 'plate',
      header: 'Placa',
      sortable: true,
      width: '120px',
      render: (vehicle) => (
        <span className="font-medium text-[#163172]">
          {vehicle.plate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      width: '140px',
      render: (vehicle) => (
        <span className="px-3 py-1 rounded-lg bg-[#D6E4F0] text-[#163172]">
          {vehicle.status}
        </span>
      ),
    },
    {
      key: 'speed_kph',
      header: 'Velocidad',
      sortable: true,
      width: '100px',
      render: (vehicle) => (
        <span className="text-[#97A3B1]">
          {vehicle.speed_kph ? `${vehicle.speed_kph.toFixed(1)} km/h` : 'N/A'}
        </span>
      ),
    },
  ];

  // Definir acciones
  const renderActions = (vehicle: Vehicle) => (
    <>
      <R2MActionIconButton
        icon="ri-eye-line"
        label="Ver detalles"
        variant="info"
        onClick={() => handleView(vehicle)}
      />
      <R2MActionIconButton
        icon="ri-delete-bin-line"
        label="Eliminar"
        variant="danger"
        onClick={() => handleDelete(vehicle)}
      />
    </>
  );

  return (
    <R2MTable
      data={vehicles}
      columns={columns}
      loading={loading}
      emptyMessage="No hay vehículos disponibles"
      getRowKey={(vehicle) => vehicle.id}
      defaultRowsPerPage={5}
      rowsPerPageOptions={[5, 10, 15, 20]}
      actions={renderActions}
    />
  );
}
```

### Ordenamiento

- **Click 1**: Ordenar ascendente (↑)
- **Click 2**: Ordenar descendente (↓)
- **Click 3**: Remover ordenamiento
- Solo columnas con `sortable: true` permiten ordenar
- Icono de flechas arriba/abajo indica columna ordenable
- Al ordenar, se resetea a la primera página

### Paginación

- **Default**: 5 filas por página
- **Opciones**: Personalizables vía `rowsPerPageOptions`
- **Navegación**: Botones anterior/siguiente con iconos Remix
- **Info**: Muestra rango actual (ej: "1-5 de 25")
- **Estados**: Botones deshabilitados en primera/última página

---

## R2MActionIconButton

Botón de acción con icono y tooltip elegante.

### Características

🎨 **5 Variantes**: primary, success, danger, warning, info
💬 **Tooltip animado**: Aparece al hover con animación suave
🎭 **Iconos Remix**: Compatible con cualquier icono ri-*
⚡ **Estados**: Soporta disabled
🌈 **Hover personalizado**: Cada variante tiene su color de hover

### Props

```typescript
interface R2MActionIconButtonProps {
  readonly icon: string;           // Clase de Remix Icon (ej: "ri-eye-line")
  readonly label: string;          // Texto del tooltip
  readonly onClick: (e: React.MouseEvent) => void;
  readonly variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
  readonly disabled?: boolean;
}
```

### Variantes

| Variante | Color     | Uso                         |
|----------|-----------|----------------------------|
| primary  | Azul R2M  | Acciones principales       |
| success  | Verde     | Confirmar, Asignar         |
| danger   | Rojo      | Eliminar, Cancelar         |
| warning  | Naranja   | Advertencias, Precaución   |
| info     | Azul      | Ver, Información           |

### Ejemplo de Uso

```tsx
import R2MActionIconButton from '../components/R2MActionIconButton';

function MyComponent() {
  return (
    <div className="flex gap-1">
      <R2MActionIconButton
        icon="ri-eye-line"
        label="Ver detalles"
        variant="info"
        onClick={(e) => {
          e.stopPropagation();
          handleView();
        }}
      />
      
      <R2MActionIconButton
        icon="ri-edit-line"
        label="Editar"
        variant="primary"
        onClick={handleEdit}
      />
      
      <R2MActionIconButton
        icon="ri-delete-bin-line"
        label="Eliminar"
        variant="danger"
        onClick={handleDelete}
        disabled={!canDelete}
      />
    </div>
  );
}
```

### Tooltip

- **Aparición**: Al hacer hover sobre el botón
- **Animación**: FadeIn suave desde abajo (0.2s)
- **Posición**: Arriba del botón, centrado
- **Flecha**: Apunta hacia el botón
- **Estilo**: Fondo oscuro con texto blanco
- **Ocultar**: No aparece cuando el botón está disabled

---

## Integración en Vehicles

Los componentes se integran de la siguiente manera:

```tsx
// 1. Definir columnas con ordenamiento
const tableColumns: R2MTableColumn<Vehicle>[] = [
  {
    key: 'plate',
    header: 'Placa',
    sortable: true,  // ✅ Permite ordenar
    render: (vehicle) => <span>{vehicle.plate}</span>,
  },
  // ... más columnas
];

// 2. Definir acciones con tooltips
const renderActions = (vehicle: Vehicle) => (
  <>
    <R2MActionIconButton
      icon="ri-eye-line"
      label="Ver detalles"  // 💬 Tooltip
      variant="info"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedVehicle(vehicle);
        setIsDetailsOpen(true);
      }}
    />
    {/* Más botones */}
  </>
);

// 3. Usar tabla con paginación de 5
<R2MTable
  data={filteredVehicles}
  columns={tableColumns}
  defaultRowsPerPage={5}  // 📄 5 por defecto
  actions={renderActions}
  getRowKey={(v) => v.id}
/>
```

---

## Paleta de Colores Rout2Me

Los componentes usan la paleta oficial:

```typescript
colors = {
  primary: '#163172',    // Azul oscuro corporativo
  secondary: '#1E56A0',  // Azul medio
  terciary: '#97A3B1',   // Gris suave
  bg: '#F6F6F6',        // Fondo de página
  surface: '#D6E4F0',   // Superficie/Cards
}
```

### Aplicación en Tabla

- **Headers**: `bg-[#D6E4F0]` (surface) con texto `text-[#163172]` (primary)
- **Hover header**: `hover:bg-[#c0d4e6]` (surface más oscuro)
- **Hover fila**: `hover:bg-[#F6F6F6]` (bg)
- **Texto secundario**: `text-[#97A3B1]` (terciary)
- **Botones paginación**: `text-[#163172]` con `hover:bg-[#D6E4F0]`
- **Focus select**: `ring-[#1E56A0]` (secondary)

---

## Iconos Remix Icon

Los botones usan iconos de [Remix Icon](https://remixicon.com/):

### Iconos Comunes en Vehicles

- `ri-eye-line` - Ver detalles
- `ri-route-line` - Rutas
- `ri-delete-bin-line` - Eliminar
- `ri-arrow-up-line` - Ordenar ascendente
- `ri-arrow-down-line` - Ordenar descendente
- `ri-arrow-up-down-line` - Sin orden
- `ri-arrow-left-s-line` - Página anterior
- `ri-arrow-right-s-line` - Página siguiente
- `ri-search-line` - Búsqueda
- `ri-close-line` - Cerrar modal

---

## Beneficios

1. **Reutilizable** - Úsalo en Users, Routes, Companies, etc.
2. **Consistente** - Paleta Rout2Me en toda la app
3. **Ordenable** - Click en headers para ordenar
4. **Accesible** - Tooltips informativos en acciones
5. **Performante** - Paginación optimizada
6. **Mantenible** - Un solo lugar para cambios globales
7. **Tipado** - TypeScript garantiza uso correcto
8. **UX mejorada** - Animaciones y feedback visual

---

## Próximas Mejoras

- [ ] Filtros avanzados integrados
- [ ] Exportar a CSV/Excel
- [ ] Selección múltiple de filas
- [ ] Columnas redimensionables
- [ ] Drag & drop para reordenar
- [ ] Guardar preferencias de usuario
- [ ] Búsqueda integrada en tabla
- [ ] Modo compacto/expandido
