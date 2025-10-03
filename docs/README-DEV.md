# 🚀 Guía de Desarrollo - Route2Me

> Documentación completa para desarrolladores que se incorporan al proyecto

## 📋 Índice

- [Requisitos Previos](#-requisitos-previos)
- [Setup Inicial](#-setup-inicial)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Desarrollo Frontend](#-desarrollo-frontend)
- [Desarrollo Backend](#-desarrollo-backend)
- [Linting y Formateo](#-linting-y-formateo)
- [Testing](#-testing)
- [Workflow de Desarrollo](#-workflow-de-desarrollo)
- [Comandos Útiles](#-comandos-útiles)
- [Troubleshooting](#-troubleshooting)

## 🔧 Requisitos Previos

### Software Requerido
```bash
# Node.js 22+ (recomendado usar nvm/fnm)
node --version  # >= 22.0.0

# pnpm 10+ (gestor de paquetes del monorepo)
npm install -g pnpm@latest

# Docker Desktop (para Supabase local)
docker --version  # Cualquier versión reciente

# Git (control de versiones)
git --version
```

### VSCode Extensions (Recomendadas)
- **TypeScript**: `ms-vscode.vscode-typescript-next`
- **ESLint**: `dbaeumer.vscode-eslint`  
- **Prettier**: `esbenp.prettier-vscode`
- **Ionic**: `ionic.ionic`
- **Tailwind CSS**: `bradlc.vscode-tailwindcss`

## 🚀 Setup Inicial

### 1. Clonar e Instalar
```bash
# Clonar repositorio
git clone https://github.com/Cruz1122/rout2me.git
cd rout2me

# Instalar todas las dependencias (monorepo)
pnpm install
```

### 2. Configurar Supabase Local
```bash
# Navegar a configuración de Supabase
cd infra/supabase

# Iniciar stack completa (requiere Docker corriendo)
pnpm dlx supabase start

# ✅ Servicios disponibles en:
# - API: http://localhost:54321
# - Studio: http://localhost:54323
# - Database: postgresql://postgres:postgres@localhost:54322/postgres
```

### 3. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp infra/supabase/.env.local.example infra/supabase/.env.local

# Las claves se generan automáticamente en `supabase start`
# Verificar con: pnpm dlx supabase status
```

### 4. Verificar Setup
```bash
# Volver a la raíz del proyecto
cd ../..

# Iniciar desarrollo
pnpm dev

# ✅ Deberías ver:
# - Passenger App: http://localhost:5174
# - Admin Web: http://localhost:5173
```

## 🏗️ Arquitectura del Proyecto

### Estructura del Monorepo
```
rout2me/
├── apps/                    # Aplicaciones principales
│   ├── passenger-app/       # App móvil (Ionic + React)
│   └── admin-web/          # Dashboard web (React)
├── packages/               # Código compartido
│   ├── shared/            # Tipos y utilidades
│   └── ui/               # Componentes UI (futuro)
├── infra/                 # Infraestructura
│   └── supabase/         # Configuración backend
├── docs/                 # Documentación
└── .github/              # CI/CD workflows
```

### Stack Tecnológico
- **Frontend**: React 19, TypeScript 5.6, Vite 7
- **Mobile**: Ionic React 8.0, Capacitor
- **Backend**: Supabase (PostgreSQL + PostGIS, Auth, Realtime)
- **Styling**: Tailwind CSS, Ionic Components
- **Build**: Turbo (monorepo), pnpm workspaces
- **Linting**: ESLint 9, Prettier, Husky hooks

## Desarrollo Frontend

### Passenger App (Ionic + React)
```bash
# Desarrollo
cd apps/passenger-app
pnpm dev  # Puerto 5174

# Estructura principal:
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas de la app
├── hooks/              # Custom hooks
├── services/           # API calls y lógica de negocio
├── types/              # Tipos específicos de la app
└── App.tsx            # Componente raíz
```

**Características:**
- ✅ **Hot Reload**: Cambios instantáneos
- ✅ **Ionic UI**: Componentes nativos móviles
- ✅ **TypeScript**: Tipado completo
- ✅ **Shared Types**: Importa desde `@rout2me/shared`

### Admin Web (React)
```bash
# Desarrollo  
cd apps/admin-web
pnpm dev  # Puerto 5173

# Estructura similar:
src/
├── components/         # Componentes del dashboard
├── pages/             # Páginas administrativas
├── hooks/             # Custom hooks
├── services/          # API calls
└── App.tsx           # Componente raíz
```

**Características:**
-  **Hot Reload**: Cambios instantáneos
-  **React Router**: Navegación SPA
-  **Tailwind CSS**: Styling utilitario
-  **Shared Types**: Importa desde `@rout2me/shared`

### Shared Package
```bash
# Desarrollo
cd packages/shared
pnpm build  # Se rebuilda automáticamente

# Estructura:
src/
├── types/             # Tipos TypeScript compartidos
├── utils/             # Utilidades comunes
├── geo-utils.ts      # Funciones geoespaciales
├── result-utils.ts   # Manejo de errores funcional
└── index.ts          # Exports principales
```

**Uso en las apps:**
```typescript
// Importar tipos y utilidades
import { LatLng, VehiclePing, Result } from '@rout2me/shared';
import { calculateDistance, formatCoordinate } from '@rout2me/shared';
```

## Desarrollo Backend

### Supabase Local Stack
El backend funciona completamente con Supabase CLI + Docker:

```bash
# Iniciar servicios (desde infra/supabase)
pnpm dlx supabase start

# Servicios incluidos:
# ├── PostgreSQL (base de datos principal)
# ├── PostGIS (extensión geoespacial)  
# ├── PostgREST (API REST automática)
# ├── GoTrue (autenticación JWT)
# ├── Realtime (WebSocket subscriptions)
# ├── Storage (archivos/imágenes)
# └── Studio (interfaz web)
```

### Desarrollo de Schema
```bash
# Ver cambios en el schema
pnpm dlx supabase db diff

# Crear migración
pnpm dlx supabase db diff --use-migra -f nombre_migracion

# Aplicar cambios
pnpm dlx supabase db push

# Reset completo (cuidado!)
pnpm dlx supabase db reset
```

### Studio (Interfaz Visual)
- **URL**: http://127.0.0.1:54323
- **Funciones**:
  - Ver/editar tablas y datos
  - Ejecutar SQL queries
  - Configurar Auth y RLS
  - Gestionar Storage buckets
  - Monitor de Realtime

### API REST Automática
Supabase genera automáticamente endpoints REST:
```typescript
// Ejemplo: tabla 'buses'
GET    /rest/v1/buses           # Listar buses
POST   /rest/v1/buses           # Crear bus
PATCH  /rest/v1/buses?id=eq.1   # Actualizar bus
DELETE /rest/v1/buses?id=eq.1   # Eliminar bus
```

## Linting y Formateo

### Configuración Automática
El proyecto incluye configuración completa de linting:

```bash
# Verificar linting (todo el monorepo)
pnpm lint

# Auto-fix automático
pnpm format

# Verificar tipos TypeScript
pnpm type-check
```

### Pre-commit Hooks (Husky)
Se ejecutan automáticamente antes de cada commit:
```bash
# Al hacer git commit, se ejecuta:
1. pnpm lint     # ESLint + Prettier
2. pnpm build    # Verificación de build
3. Commit OK
```

### ESLint Rules
- **React Hooks**: Reglas de hooks
- **TypeScript**: Tipado estricto
- **Import Order**: Imports organizados
- **Unused Vars**: Variables no usadas

### Prettier Config
- **Tabs**: 2 espacios
- **Quotes**: Single quotes
- **Semicolons**: Siempre
- **Trailing Commas**: ES5

## Testing

### Setup Futuro
```bash
# Instalar testing (cuando sea necesario)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Scripts recomendados:
"test": "vitest"
"test:ui": "vitest --ui"
"test:coverage": "vitest --coverage"
```

## Workflow de Desarrollo

### Desarrollo Diario
```bash
# 1. Iniciar backend
cd infra/supabase
pnpm dlx supabase start

# 2. Desarrollo frontend (terminal separado)
cd ../../  # Volver a raíz
pnpm dev   # Inicia ambas apps

# ¡Listo para desarrollar!
```

### Workflow por Funcionalidad

#### 1. Nueva Feature Frontend
```bash
# 1. Crear branch
git checkout -b feat/nueva-funcionalidad

# 2. Desarrollar en apps/
cd apps/passenger-app
# Editar componentes, páginas, etc.

# 3. Usar tipos compartidos
import { LatLng } from '@rout2me/shared';

# 4. Commit con linting automático
git add .
git commit -m "feat: nueva funcionalidad"
```

#### 2. Nueva Feature Backend
```bash
# 1. Modificar schema
cd infra/supabase
pnpm dlx supabase db diff --use-migra -f add_new_table

# 2. Editar migración generada
# supabase/migrations/xxxxx_add_new_table.sql

# 3. Aplicar cambios
pnpm dlx supabase db push

# 4. Verificar en Studio
# http://127.0.0.1:54323
```

#### 3. Tipos Compartidos
```bash
# 1. Agregar tipos en shared
cd packages/shared/src/types
# Editar index.ts

# 2. Build automático
pnpm build  # Se ejecuta automáticamente

# 3. Usar en apps inmediatamente
import { NuevoTipo } from '@rout2me/shared';
```

## Comandos Útiles

### Monorepo
```bash
# Instalar dependencia en app específica
pnpm add react-router-dom --filter=admin-web

# Ejecutar script en todas las apps
pnpm -r run build

# Limpiar node_modules
pnpm -r exec rm -rf node_modules
pnpm install
```

### Supabase
```bash
cd infra/supabase

# Gestión de servicios
pnpm dlx supabase start     # Iniciar
pnpm dlx supabase stop      # Parar
pnpm dlx supabase status    # Estado

# Base de datos
pnpm dlx supabase db reset  # Reset completo
pnpm dlx supabase db diff   # Ver cambios
pnpm dlx supabase db push   # Aplicar cambios

# Migraciones
pnpm dlx supabase db diff --use-migra -f migration_name
pnpm dlx supabase migration list
pnpm dlx supabase migration up

# Studio
pnpm dlx supabase studio    # Abrir Studio
```

### Development
```bash
# Frontend
pnpm dev              # Todas las apps
pnpm dev:passenger    # Solo passenger app
pnpm dev:admin        # Solo admin web

# Build & Test
pnpm build           # Build todo
pnpm lint            # Linting
pnpm format          # Formateo
pnpm type-check      # Verificar tipos
```

## Troubleshooting

### "Docker no está corriendo"
```bash
# Iniciar Docker Desktop
# Windows: Buscar "Docker Desktop" y ejecutar
# Mac: Aplicaciones → Docker
# Linux: sudo systemctl start docker

# Verificar
docker ps
```

### "Puerto ya en uso"
```bash
# Encontrar proceso usando puerto
netstat -ano | findstr :5173  # Windows
lsof -i :5173                 # Mac/Linux

# Matar proceso
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Mac/Linux
```

### "Supabase start falla"
```bash
# Limpiar containers
pnpm dlx supabase stop
docker system prune -f

# Reiniciar
pnpm dlx supabase start
```

### "Hot reload no funciona"
```bash
# Limpiar cache de Vite
rm -rf apps/passenger-app/.vite
rm -rf apps/admin-web/.vite

# Reinstalar dependencias
pnpm install
```

### "Error de tipos en shared"
```bash
# Rebuild shared package
cd packages/shared
pnpm build

# Verificar exports
cat dist/index.d.ts
```

### "ESLint/Prettier conflictos"
```bash
# Reset configuración
rm -rf node_modules/.cache
pnpm format
pnpm lint --fix
```

## Recursos Adicionales

- **[Ionic React Docs](https://ionicframework.com/docs/react)**
- **[Supabase Docs](https://supabase.com/docs)**
- **[Vite Docs](https://vitejs.dev/)**
- **[pnpm Workspaces](https://pnpm.io/workspaces)**
- **[Turbo Docs](https://turbo.build/repo/docs)**

## Obtener Ayuda

1. **Documentación**: Revisa `docs/` y `README.md`
2. **Team**: Pregunta al equipo en Discord

---

Si tienes dudas sobre este setup, no dudes en preguntar o mejorar esta documentación.