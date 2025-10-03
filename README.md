# Route2Me

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![Ionic](https://img.shields.io/badge/Ionic-8%2B-blue.svg)](https://ionicframework.com/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-green.svg)](https://supabase.com/)

> Plataforma de rastreo y visualización de buses en tiempo real

Sistema moderno, escalable y rentable para el seguimiento de transporte público en tiempo real, construido con **Ionic + React** y **Supabase**.

## Inicio Rápido

```bash
# Requisitos: Node 22.x, pnpm 10+
npm install -g pnpm
pnpm install

# Desarrollo
pnpm dev
```

## Aplicaciones

- **[Passenger App](./apps/passenger-app/)** - Aplicación móvil para pasajeros (Ionic + React)
- **[Admin Web](./apps/admin-web/)** - Panel de administración web (React)

## Paquetes

- **[Shared](./packages/shared/)** - Tipos TypeScript y utilidades compartidas

## Infraestructura

- **[Supabase](./infra/supabase/)** - Configuración de backend, migraciones y políticas

## Documentación

**[Documentación Completa](./docs/README.md)** - Arquitectura, flujos y detalles técnicos

- [Architecture Decision Records (ADR)](./docs/ADR/)
- [Guías de Desarrollo](./docs/)

## Tecnologías

- **Frontend**: Ionic, React, TypeScript, Capacitor
- **Backend**: Supabase (PostgreSQL + PostGIS, Auth, Realtime)  
- **Mapas**: Stadia Maps (OpenStreetMap)
- **Monorepo**: pnpm workspaces


