# @rout2me/shared

Librería de código compartido para el monorepo Rout2Me. Contiene tipos TypeScript, utilidades y lógica de negocio común entre las aplicaciones (Passenger App y Admin Web).

## 📦 Contenido

### 🛠️ Utilidades (`/utils`)

- **Geo Utils** (`geo-utils.ts`): Funciones para cálculos geoespaciales.
  - `calculateDistance(start, end)`: Distancia Haversine entre dos puntos.
  - `formatCoordinate(coord)`: Formateo de coordenadas para UI.
  - `isValidCoordinate(lat, lng)`: Validación de datos GPS.

- **Result Utils** (`result-utils.ts`): Patrón Result para manejo de errores funcional.
  - `Result<T, E>`: Tipo discriminado para operaciones falibles.
  - `ok(value)`: Constructor de éxito.
  - `err(error)`: Constructor de error.

### 📡 API & Tipos (`/api`)

Definiciones de tipos compartidas para asegurar consistencia entre Frontend y Backend.

- **Supabase Client**: Cliente singleton configurado.
- **Modelos de Datos**: Interfaces para `Bus`, `Route`, `Stop`, `User`, etc.

## 🚀 Uso

Instalar en otra aplicación del monorepo:

```bash
pnpm add @rout2me/shared --filter=nombre-app
```

Importar en código:

```typescript
import { calculateDistance } from '@rout2me/shared';
import type { BusPosition } from '@rout2me/shared';

const dist = calculateDistance(pos1, pos2);
```

## 🔧 Desarrollo

El paquete se compila automáticamente gracias a la configuración de Turbo y tsc.

```bash
# Compilar manualmente
pnpm build

# Verificar tipos
pnpm type-check
```
