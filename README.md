# Rout2Me

[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![Ionic](https://img.shields.io/badge/Ionic-8%2B-blue.svg)](https://ionicframework.com/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-green.svg)](https://supabase.com/)

> **Plataforma integral de gestión y visualización de transporte público en tiempo real.**

Rout2Me es un sistema moderno, escalable y rentable diseñado para transformar la experiencia del transporte urbano. Conecta a pasajeros, conductores y administradores a través de una infraestructura robusta basada en **Supabase** y aplicaciones cliente de alto rendimiento construidas con **Ionic + React**.

El proyecto se encuentra en una etapa de madurez avanzada, con casi el **100% de las funcionalidades core implementadas**.

---

## 🚀 Características Principales

### 📱 Para Pasajeros (Passenger App)
- **Rastreo en Tiempo Real**: Visualización fluida de buses moviéndose en el mapa con actualizaciones cada 10s.
- **Predicción de Rutas**: Algoritmos de ETA (Tiempo Estimado de Llegada) precisos.
- **Búsqueda Inteligente**: Encuentra rutas y paraderos cercanos a tu ubicación.
- **Interfaz Moderna**: Experiencia de usuario nativa y responsiva (iOS/Android/Web).
- **Modo Oscuro**: Soporte nativo para temas claro y oscuro.

### 💻 Para Administradores (Admin Web)
- **Dashboard de Control**: Vista de pájaro de toda la flota operativa.
- **Gestión de Flota**: Administración completa de vehículos, conductores y asignaciones.
- **Editor de Rutas**: Herramientas visuales para crear y modificar trazados y paradas.
- **Seguridad Robusta**: Sistema de roles y permisos granular (RBAC).
- **Analíticas en Vivo**: Monitoreo de ocupación, puntualidad e incidentes.

---

## 🏗️ Arquitectura del Proyecto

Este repositorio es un **monorepo** gestionado con `pnpm workspaces` y `turbo`, organizado para máxima eficiencia y reutilización de código.

### 📂 Estructura

- **[📱 Passenger App](./apps/passenger-app/)**: Aplicación móvil híbrida (Ionic + Capacitor).
- **[💻 Admin Web](./apps/admin-web/)**: Panel de administración web (React + Vite).
- **[📦 Shared Packages](./packages/shared/)**: Librería de tipos, utilidades y lógica compartida.
- **[☁️ Infraestructura](./infra/supabase/)**: Configuración de backend (Supabase), migraciones y Edge Functions.

### 🛠️ Stack Tecnológico

- **Frontend**: Ionic Framework 8, React 18, Tailwind CSS.
- **Backend (BaaS)**: Supabase (PostgreSQL 15+, PostGIS, Auth, Realtime).
- **Mapas**: MapLibre GL JS, Stadia Maps (Map Matching).
- **Lenguaje**: TypeScript 5.9 (Strict Mode).
- **CI/CD**: GitHub Actions.

---

## 🏁 Inicio Rápido

### Requisitos Previos
- **Node.js**: 22.x (LTS)
- **pnpm**: 10+
- **Docker Desktop**: Requerido para ejecutar Supabase localmente.

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Cruz1122/rout2me.git
   cd rout2me
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Iniciar Backend Local (Supabase)**
   ```bash
   cd infra/supabase
   pnpm dlx supabase start
   ```
   > Esto levantará la base de datos, autenticación y APIs en Docker.

4. **Iniciar Aplicaciones (Modo Desarrollo)**
   ```bash
   # En la raíz del proyecto
   pnpm dev
   ```
   Esto iniciará simultáneamente:
   - **Passenger App**: http://localhost:5174
   - **Admin Web**: http://localhost:5173

---

## 📚 Documentación

Para detalles técnicos profundos, consulta las guías específicas:

- **[Guía de Desarrollo](./docs/README-DEV.md)**: Setup detallado, convenciones y workflow.
- **[Arquitectura del Sistema](./docs/README.md)**: Diagramas C4, modelos de datos y decisiones de diseño.
- **[Documentación de API](./packages/shared/README.md)**: Tipos y utilidades compartidas.

---

## 🔧 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia todas las aplicaciones en modo desarrollo. |
| `pnpm build` | Compila todo el proyecto para producción. |
| `pnpm lint` | Ejecuta ESLint en todos los paquetes. |
| `pnpm format` | Formatea el código con Prettier. |
| `pnpm type-check` | Verifica tipos TypeScript en todo el monorepo. |

---

## 👥 Contribución

Este proyecto es parte del curso de Ingeniería de Software III. Las contribuciones siguen el flujo de trabajo estándar de Gitflow.

1. Crea un branch para tu feature (`git checkout -b feat/nueva-feature`).
2. Haz commit de tus cambios (`git commit -m 'feat: agrega nueva feature'`).
3. Haz push al branch (`git push origin feat/nueva-feature`).
4. Abre un Pull Request.

---



