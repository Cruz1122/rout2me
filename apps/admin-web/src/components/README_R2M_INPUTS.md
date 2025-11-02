# R2MInput y R2MSelect - Componentes de Formulario

## R2MInput - Componente de Input Reutilizable

### Descripción

`R2MInput` es un componente de campo de entrada altamente estilizado y reutilizable que proporciona una experiencia de usuario consistente en todos los formularios. Incluye soporte para iconos, validación visual, y estados interactivos.

### Características

- **Tipos de Input**: text, email, password, tel, number
- **Iconos de Remix Icon**: Soporte para iconos a la izquierda
- **Validación Visual**: Borde y sombra cambian según estado (normal, focus, error)
- **Password Toggle**: Botón para mostrar/ocultar contraseña
- **Animaciones Suaves**: Transiciones de 200ms en todos los estados
- **Mensajes de Error**: Muestra errores debajo del input con icono
- **Estados**: Normal, Focus, Error, Disabled
- **Accesibilidad**: Focus visible, labels apropiados

### Props

```typescript
interface R2MInputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';  // Tipo de input (default: 'text')
  placeholder: string;              // Texto placeholder
  value: string;                    // Valor del input
  onValueChange: (value: string) => void;  // Callback al cambiar valor
  required?: boolean;               // Campo requerido (default: false)
  error?: string;                   // Mensaje de error a mostrar
  icon?: string;                    // Clase de icono de Remix Icon
  disabled?: boolean;               // Estado deshabilitado (default: false)
  maxLength?: number;               // Longitud máxima permitida
  onBlur?: () => void;             // Callback al perder focus
}
```

### Colores de Estado

- **Normal**: Borde `#dcdfe5` (gris claro)
- **Focus**: Borde `#1E56A0` (azul Rout2Me) + sombra azul
- **Error**: Borde `#ef4444` (rojo) + sombra roja
- **Icon Focus**: `#1E56A0` (azul)
- **Icon Normal**: `#97A3B1` (gris)

### Uso Básico

```tsx
import R2MInput from '../components/R2MInput';

function MyForm() {
  const [name, setName] = useState('');

  return (
    <R2MInput
      type="text"
      placeholder="Ingrese su nombre"
      value={name}
      onValueChange={setName}
      icon="ri-user-line"
    />
  );
}
```

### Ejemplo con Validación

```tsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const validateEmail = () => {
  if (!email.includes('@')) {
    setEmailError('Email inválido');
  } else {
    setEmailError('');
  }
};

return (
  <div>
    <label className="flex flex-col">
      <p className="text-base font-medium pb-2">Email</p>
      <R2MInput
        type="email"
        placeholder="correo@ejemplo.com"
        value={email}
        onValueChange={setEmail}
        icon="ri-mail-line"
        error={emailError}
        onBlur={validateEmail}
        required
      />
    </label>
  </div>
);
```

### Ejemplo con Password

```tsx
<R2MInput
  type="password"
  placeholder="Ingrese su contraseña"
  value={password}
  onValueChange={setPassword}
  icon="ri-lock-password-line"
  error={passwordError}
/>
```
- Muestra automáticamente botón de mostrar/ocultar
- Icono de ojo cambia entre `ri-eye-line` y `ri-eye-off-line`

### Ejemplo con Teléfono

```tsx
<R2MInput
  type="tel"
  placeholder="300 123 4567"
  value={phone}
  onValueChange={setPhone}
  icon="ri-phone-line"
  maxLength={10}
/>
```

### Ejemplo con Número

```tsx
<R2MInput
  type="number"
  placeholder="Ingrese la capacidad"
  value={capacity}
  onValueChange={(value) => setCapacity(value.replace(/[^0-9]/g, ''))}
  icon="ri-group-line"
  error={capacityError}
/>
```

### Ejemplo Deshabilitado

```tsx
<R2MInput
  type="text"
  placeholder="Campo deshabilitado"
  value={value}
  onValueChange={setValue}
  disabled={true}
  icon="ri-lock-line"
/>
```

---

## R2MSelect - Componente de Select Reutilizable

### Descripción

`R2MSelect` es un componente de selección (dropdown) estilizado que mantiene consistencia visual con R2MInput. Incluye iconos, estados de carga, validación y animaciones.

### Características

- **Iconos de Remix Icon**: Icono a la izquierda del select
- **Flecha Animada**: Rotación de 180° al hacer focus
- **Estado de Carga**: Muestra "Cargando..." cuando loading=true
- **Validación Visual**: Mismos estilos de borde y sombra que R2MInput
- **Mensajes de Error**: Muestra errores debajo con icono
- **Estados**: Normal, Focus, Error, Disabled, Loading

### Props

```typescript
interface R2MSelectProps {
  value: string;                    // Valor seleccionado
  onChange: (value: string) => void; // Callback al cambiar selección
  options: readonly { value: string; label: string }[]; // Opciones
  placeholder?: string;              // Texto placeholder (default: 'Seleccione una opción')
  error?: string;                   // Mensaje de error
  icon?: string;                    // Clase de icono de Remix Icon
  disabled?: boolean;               // Estado deshabilitado
  loading?: boolean;                // Estado de carga
  onBlur?: () => void;             // Callback al perder focus
}
```

### Uso Básico

```tsx
import R2MSelect from '../components/R2MSelect';

function MyForm() {
  const [country, setCountry] = useState('');

  return (
    <R2MSelect
      value={country}
      onChange={setCountry}
      options={[
        { value: 'co', label: 'Colombia' },
        { value: 'mx', label: 'México' },
        { value: 'ar', label: 'Argentina' },
      ]}
      placeholder="Seleccione un país"
      icon="ri-map-pin-line"
    />
  );
}
```

### Ejemplo con Carga de Datos

```tsx
const [company, setCompany] = useState('');
const [companies, setCompanies] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchCompanies()
    .then(data => setCompanies(data))
    .finally(() => setLoading(false));
}, []);

return (
  <R2MSelect
    value={company}
    onChange={setCompany}
    options={companies.map(c => ({
      value: c.id,
      label: `${c.name}${c.short_name ? ` (${c.short_name})` : ''}`
    }))}
    placeholder="Seleccione una compañía"
    icon="ri-building-line"
    loading={loading}
  />
);
```

### Ejemplo con Validación

```tsx
const [status, setStatus] = useState('');
const [error, setError] = useState('');

const validateStatus = () => {
  if (!status) {
    setError('El estado es obligatorio');
  } else {
    setError('');
  }
};

return (
  <div>
    <label className="flex flex-col">
      <p className="text-base font-medium pb-2">Estado</p>
      <R2MSelect
        value={status}
        onChange={setStatus}
        options={[
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' },
        ]}
        placeholder="Seleccione el estado"
        icon="ri-checkbox-circle-line"
        error={error}
        onBlur={validateStatus}
      />
    </label>
  </div>
);
```

---

## Ejemplos Completos

### Formulario de Vehículo

```tsx
<R2MModal
  isOpen={isOpen}
  onClose={onClose}
  title="Crear Vehículo"
  maxWidth="lg"
  footer={
    <div className="flex gap-3 justify-end">
      <R2MButton variant="ghost" onClick={onClose}>
        Cancelar
      </R2MButton>
      <R2MButton 
        variant="secondary" 
        loading={loading}
        onClick={handleSubmit}
      >
        Crear Vehículo
      </R2MButton>
    </div>
  }
>
  <div className="space-y-5">
    {/* Select de Compañía */}
    <div>
      <label className="flex flex-col">
        <p className="text-base font-medium pb-2">Compañía</p>
        <R2MSelect
          value={company}
          onChange={setCompany}
          options={companies.map(c => ({
            value: c.id,
            label: c.name
          }))}
          placeholder="Seleccione una compañía"
          icon="ri-building-line"
          loading={loadingCompanies}
          error={errors.company}
        />
      </label>
    </div>

    {/* Input de Placa */}
    <div>
      <label className="flex flex-col">
        <p className="text-base font-medium pb-2">Placa</p>
        <R2MInput
          type="text"
          value={plate}
          onValueChange={setPlate}
          placeholder="ABC-123"
          icon="ri-car-line"
          maxLength={7}
          error={errors.plate}
        />
      </label>
    </div>

    {/* Input de Capacidad */}
    <div>
      <label className="flex flex-col">
        <p className="text-base font-medium pb-2">Capacidad</p>
        <R2MInput
          type="number"
          value={capacity}
          onValueChange={setCapacity}
          placeholder="Ingrese la capacidad"
          icon="ri-group-line"
          error={errors.capacity}
        />
      </label>
    </div>
  </div>
</R2MModal>
```

### Formulario de Login

```tsx
<div className="space-y-5">
  <div>
    <label className="flex flex-col">
      <p className="text-base font-medium pb-2">Email</p>
      <R2MInput
        type="email"
        value={email}
        onValueChange={setEmail}
        placeholder="correo@ejemplo.com"
        icon="ri-mail-line"
        error={errors.email}
        required
      />
    </label>
  </div>

  <div>
    <label className="flex flex-col">
      <p className="text-base font-medium pb-2">Contraseña</p>
      <R2MInput
        type="password"
        value={password}
        onValueChange={setPassword}
        placeholder="••••••••"
        icon="ri-lock-password-line"
        error={errors.password}
        required
      />
    </label>
  </div>
</div>
```

---

## Iconos Recomendados

### Campos de Usuario
- `ri-user-line` - Nombre de usuario
- `ri-mail-line` - Email
- `ri-lock-password-line` - Contraseña
- `ri-phone-line` - Teléfono
- `ri-id-card-line` - Identificación

### Vehículos y Transporte
- `ri-car-line` - Placa/Vehículo
- `ri-steering-2-line` - Conductor
- `ri-group-line` - Capacidad/Pasajeros
- `ri-building-line` - Compañía

### General
- `ri-calendar-line` - Fecha
- `ri-map-pin-line` - Ubicación/Dirección
- `ri-money-dollar-circle-line` - Precio/Dinero
- `ri-text` - Texto general
- `ri-hashtag` - Código/ID

---

## Mejores Prácticas

### R2MInput

1. **Siempre usa labels**: Envuelve en `<label>` con texto descriptivo
2. **Espaciado consistente**: Usa `space-y-5` para separar campos
3. **Validación en onBlur**: Valida cuando el usuario sale del campo
4. **Iconos descriptivos**: Usa iconos que ayuden a identificar el campo
5. **MaxLength apropiado**: Limita caracteres para campos como placas
6. **Mensajes de error claros**: Error específico y accionable

### R2MSelect

1. **Options dinámicas**: Transforma tus datos al formato requerido
2. **Loading state**: Usa `loading={true}` mientras cargas datos
3. **Placeholder descriptivo**: Indica qué debe seleccionar el usuario
4. **Primer option disabled**: El placeholder no debe ser seleccionable
5. **Labels descriptivas**: Muestra información útil en las opciones

### Formularios en Modales

1. **Usa space-y-5**: Separación consistente entre campos
2. **Labels claros**: `text-base font-medium pb-2`
3. **Footer con botones**: Siempre Cancelar + Acción principal
4. **Loading en submit**: Muestra estado de carga en botón de acción
5. **Validación completa**: Valida todos los campos antes de submit

---

## Accesibilidad

- ✅ Labels asociados correctamente con inputs
- ✅ Estados de focus visibles
- ✅ Mensajes de error legibles
- ✅ Navegación por teclado funcional
- ✅ Estados disabled claros visualmente
- ✅ Placeholder no reemplaza labels

---

## Transiciones y Animaciones

- **Border & Shadow**: `transition-all duration-200`
- **Icon Color**: `transition-colors duration-200`
- **Select Arrow**: `transition-transform duration-200`
- **Focus**: Cambio inmediato de borde + sombra suave

---

## Integración con R2MFilterSwitcher

Para estados de tipo "radio button", usa `R2MFilterSwitcher` en lugar de `R2MSelect`:

```tsx
{/* En lugar de Select */}
<div>
  <p className="text-base font-medium pb-2">Estado</p>
  <R2MFilterSwitcher
    options={[
      { id: 'active', label: 'Activo', icon: 'ri-checkbox-circle-line' },
      { id: 'inactive', label: 'Inactivo', icon: 'ri-close-circle-line' },
    ]}
    activeFilter={status}
    onFilterChange={setStatus}
  />
</div>
```
