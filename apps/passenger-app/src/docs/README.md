# Documentación Técnica - Passenger App

Este directorio centraliza la documentación técnica específica de la aplicación móvil de pasajeros.

## 📚 Módulos Principales

### 🗺️ [Sistema de Rutas y Mapas](./README_ROUTES_SYSTEM.md)
Motor de renderizado de rutas utilizando MapLibre GL y Stadia Maps.
- Arquitectura de capas y fuentes de datos.
- Algoritmos de Map Matching.
- Animación de vehículos en tiempo real.

### 🔐 [Autenticación y Seguridad](./README_AUTH.md)
Implementación robusta de seguridad con Supabase Auth.
- Flujos de Registro y Login.
- Persistencia de sesión segura.
- Protección de rutas (Route Guards).

### 🚀 [Rendimiento y Caché](./CACHE_SYSTEM.md)
Estrategias de optimización para experiencia móvil fluida.
- Service Workers.
- Caché de tiles y assets estáticos.
- Manejo de estado offline.

### 📍 [Gestión de Paradas](./IMPLEMENTACION_PARADAS.md)
Lógica de negocio para puntos de parada.
- Integración con API de rutas.
- Cálculo de distancias y tiempos.

---

## 🛠️ Guías de Mantenimiento

### [Corrección de API](./CORRECCION_API.md)
Historial de soluciones a problemas comunes de integración con el backend, específicamente relacionados con tipos de datos y validación.

---

## 📂 Estructura del Código

```
src/
├── services/          # Lógica de negocio y llamadas API
├── hooks/            # Hooks personalizados (useAuth, useRouteDrawing)
├── components/       # UI Kit y componentes visuales
├── pages/            # Vistas principales (Ionic Pages)
├── types/            # Definiciones TypeScript
└── docs/             # Esta documentación
```

> Para una visión general de todo el sistema, consulta el [README principal](../../../../README.md).
