# Route2Me

[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![Ionic](https://img.shields.io/badge/Ionic-8%2B-blue.svg)](https://ionicframework.com/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-green.svg)](https://supabase.com/)

> Plataforma de rastreo y visualización de buses en tiempo real

Sistema moderno, escalable y rentable para el seguimiento de transporte público en tiempo real, construido con **Ionic + React** y **Supabase**.

## Inicio Rápido

```bash
# Requisitos: Node 22.x, pnpm 10+, Docker Desktop
npm install -g pnpm
pnpm install

# Configurar Supabase local
cd infra/supabase
pnpm dlx supabase start

# Desarrollo
pnpm dev
```

> **Nota**: El desarrollo local requiere Docker Desktop ejecutándose para los servicios de Supabase

## Aplicaciones

- **[Passenger App](./apps/passenger-app/)** - Aplicación móvil para pasajeros (Ionic + React)
- **[Admin Web](./apps/admin-web/)** - Panel de administración web (React)

## Paquetes

- **[Shared](./packages/shared/)** - Tipos TypeScript y utilidades compartidas

## Infraestructura

- **[Supabase](./infra/supabase/)** - Configuración de backend, migraciones y políticas
  - PostgreSQL + PostGIS para datos geoespaciales
  - Auth JWT para autenticación
  - Realtime para actualizaciones en vivo
  - Storage para archivos multimedia

## Documentación

**[Documentación Completa](./docs/README.md)** - Arquitectura, flujos y detalles técnicos

- [Architecture Decision Records (ADR)](./docs/ADR/)
- [Guías de Desarrollo](./docs/)

## Tecnologías

- **Frontend**: Ionic, React, TypeScript, Capacitor
- **Backend**: Supabase (PostgreSQL + PostGIS, Auth, Realtime)  
- **Mapas**: Stadia Maps (OpenStreetMap)
- **Monorepo**: pnpm workspaces, Turbo
- **CI/CD**: GitHub Actions
- **Desarrollo Local**: Docker, Supabase CLI

## Comandos Útiles

```bash
# Instalar dependencias
pnpm install

# Desarrollo (todas las apps)
pnpm dev

# Build del proyecto completo
pnpm build

# Linting y formato
pnpm lint
pnpm format

# Supabase local
cd infra/supabase
pnpm dlx supabase start    # Iniciar servicios
pnpm dlx supabase status   # Ver estado
pnpm dlx supabase stop     # Detener servicios
```


