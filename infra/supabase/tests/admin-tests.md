# Pruebas de Backend – Historias de Usuario ADM (rout2me)

Este documento describe las pruebas de integración agregadas para las historias:

- **US-ADM-016 – Asignar roles**
- **US-ADM-003 – Actualizar ruta**
- **US-ADM-004 – Eliminar ruta**
- **US-ADM-008 – Actualizar bus**
- **US-ADM-009 – Eliminar bus**

Todas las pruebas se ejecutan con **Vitest** y usan los mismos helpers que el resto
del proyecto (`admin`, `anon`, `restUser`, `uniq`, `must`, etc.).

---

## 1. US-ADM-016 – Asignar roles

**Archivo:** `infra/supabase/tests/user.admin.spec.ts`  
**Test nuevo:** `rechaza asignar un rol no permitido en user_roles`

### Objetivo

Garantizar que **no se puedan asignar roles arbitrarios** a un usuario, es decir,
que la tabla `user_roles` solo acepte valores del catálogo de roles válidos.

### Comportamiento probado

1. Se crea un usuario (`user1Id`) mediante el Admin API.
2. Se intenta insertar una fila en `user_roles` con:
   - `user_id = user1Id`
   - `role = "INVALID_ROLE_TEST"`
3. Se espera que Supabase devuelva un **error de constraint** (FK, CHECK o ENUM).

---

## 2. US-ADM-004 – Eliminar ruta

**Archivo:** `infra/supabase/tests/routes.spec.ts`  
**Test nuevo:** `intentar eliminar una ruta inexistente no afecta la tabla`

### Objetivo

Verificar que el endpoint de eliminación de rutas **maneja correctamente** el caso
en el que el `id` no existe:

- No debe borrar ninguna fila.
- Puede devolver error o código 4xx, según la implementación, pero el estado de la tabla se mantiene.

### Comportamiento probado

1. Se usa un UUID dummy (`00000000-0000-0000-0000-000000000000`).
2. Se ejecuta `DELETE` sobre `routes` filtrando por ese `id`.
3. Se comprueba que `count === 0` (ninguna fila afectada).

---

## 3. US-ADM-003 – Actualizar ruta

**Archivo:** `infra/supabase/tests/routes.spec.ts`  
**Tests nuevos:**

- `rechaza actualizar una ruta con un code duplicado (valor inválido)`  
- `intentar actualizar una ruta inexistente no afecta la tabla`

### Objetivo

Cubrir:

1. **Ruta existente con valores inválidos**  
   Se usa la constraint `UNIQUE (code)`:
   - Se crean dos rutas con códigos distintos.
   - Se intenta actualizar la segunda para que tenga el mismo `code` que la primera.
   - Se espera error `23505` (violación de UNIQUE).

2. **Ruta inexistente**  
   - Se intenta hacer `UPDATE` sobre un `id` inexistente.
   - Se verifica que no se actualiza ninguna fila (`count === 0`) y, si hay error, que sea 4xx.

---

## 4. US-ADM-008 – Actualizar bus

**Archivo:** `infra/supabase/tests/buses.spec.ts`  
**Tests nuevos:**

- `rechaza actualizar un bus existente con capacidad inválida (0)`  
- `intentar actualizar un bus inexistente no afecta la tabla`

### Objetivo

Extender la validación de negocio de **capacidad > 0** también al flujo de
actualización y asegurar un comportamiento consistente para buses inexistentes.

### Comportamiento probado

1. **Bus existente con valores inválidos**
   - Se crea un bus con `capacity = 30`.
   - Se intenta actualizar a `capacity = 0`.
   - Se espera error de validación/constraint.
   - Se comprueba que la capacidad en BD sigue siendo > 0.

2. **Bus inexistente**
   - Se intenta `UPDATE` sobre un `id` inexistente.
   - Se verifica que no se actualiza ninguna fila.

---

## 5. US-ADM-009 – Eliminar bus

**Archivo:** `infra/supabase/tests/buses.spec.ts`  
**Test nuevo:** `intentar eliminar un bus inexistente no afecta la tabla`

### Objetivo

Asegurar que el endpoint de eliminación de buses **no altera datos** cuando el
`id` no existe.

### Comportamiento probado

1. Se usa el mismo UUID dummy inexistente.
2. Se ejecuta `DELETE` sobre `buses` con ese `id`.
3. Se verifica que `count === 0` y opcionalmente se documenta el código de respuesta.

---

## 6. Ejecución de las pruebas

Desde la carpeta raíz del proyecto:

```bash
cd infra/supabase
pnpm test
