FRONT-API · Integración con Supabase (Auth + Buses)
1) Variables de entorno

En cada app (apps/admin-web y apps/passenger-app) crear .env.local:

VITE_SUPABASE_URL=https://rcdsqsvfxyfnrueoovpy.supabase.co
VITE_SUPABASE_ANON_KEY=<PUBLISHABLE_KEY que empieza por sb_publishable_...>


No subir .env.local al repo. Subir .env.example con placeholders.

2) Base del API

REST base URL: https://rcdsqsvfxyfnrueoovpy.supabase.co/rest/v1

Auth base URL: https://rcdsqsvfxyfnrueoovpy.supabase.co/auth/v1

Header común:

apikey: <PUBLISHABLE_KEY>

Lectura pública: Authorization: Bearer <PUBLISHABLE_KEY>

Operaciones protegidas (p.ej. crear bus): Authorization: Bearer <ACCESS_TOKEN> (token del login)

3) Autenticación (usando Supabase Auth con UI propia)
3.1 Endpoints REST

Sign up

POST /auth/v1/signup
Headers: apikey, Content-Type: application/json
Body: { "email": "user@example.com", "password": "TuPass123" }


Sign in (password)

POST /auth/v1/token?grant_type=password
Headers: apikey, Content-Type: application/json
Body: { "email": "user@example.com", "password": "TuPass123" }
→ devuelve { access_token, refresh_token, user, ... }


Get user

GET /auth/v1/user
Headers: Authorization: Bearer <access_token>


Sign out

POST /auth/v1/logout
Headers: Authorization: Bearer <access_token>


Ejemplo login (curl)

curl -s -X POST "https://rcdsqsvfxyfnrueoovpy.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <PUBLISHABLE_KEY>" \
  -H "Content-Type: application/json" \
  --data '{"email":"disp@demo.com","password":"TuPass123"}'

3.2 Perfil actual (con RPC)

Mi perfil

POST /rest/v1/rpc/me_profile
Headers: apikey, Authorization: Bearer <access_token>
Body: (vacío)

4) Buses — Leer y Crear
4.1 Leer (público)
GET /rest/v1/buses?select=id,company_id,plate,capacity,status,created_at
GET /rest/v1/buses?select=*&company_id=eq.<UUID_COMPANY>
Headers: apikey, Authorization: Bearer <PUBLISHABLE_KEY>


curl

curl -s "https://rcdsqsvfxyfnrueoovpy.supabase.co/rest/v1/buses?select=*" \
  -H "apikey: <PUBLISHABLE_KEY>" \
  -H "Authorization: Bearer <PUBLISHABLE_KEY>"

4.2 Crear (protegido por RLS)
POST /rest/v1/buses
Headers: apikey, Authorization: Bearer <ACCESS_TOKEN>, Content-Type: application/json, Prefer: return=representation
Body:
{
  "company_id": "UUID_COMPANY",
  "plate": "AAA123",
  "capacity": 40,
  "status": "AVAILABLE"
}


curl

curl -s -X POST "https://rcdsqsvfxyfnrueoovpy.supabase.co/rest/v1/buses" \
  -H "apikey: <PUBLISHABLE_KEY>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  --data '{"company_id":"<UUID_COMPANY>","plate":"AAA123","capacity":40,"status":"AVAILABLE"}'


Errores esperables

403 → el usuario no tiene membership con rol permitido en esa company_id (COMPANY_ADMIN | DISPATCHER | OPERATOR).

23505 → plate duplicada.

400/422 → payload inválido.

5) Ejemplo con @supabase/supabase-js (TypeScript)
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// 1) Login
await sb.auth.signInWithPassword({ email, password }); // guarda el access_token internamente

// 2) Leer buses (público)
const { data: buses, error: e1 } = await sb
  .from('buses')
  .select('id,company_id,plate,capacity,status,created_at')
  .order('created_at', { ascending: false });
if (e1) throw e1;

// 3) Crear bus (requiere membership válida del usuario en esa company)
const { data: created, error: e2 } = await sb
  .from('buses')
  .insert({ company_id, plate, capacity, status: 'AVAILABLE' })
  .select('*')
  .single();
if (e2) throw e2;

6) Datos de prueba (MVP)

Empresa: Transporte Metropolitana (short_name = TM)

Rutas/Variantes/Paradas: creadas (mínimas)

Bus de ejemplo: TMX-101 (status: AVAILABLE)

Usuario de prueba: disp@demo.com (crear con Sign up si no existe)

Membership: DISPATCHER en la empresa TM

Con este usuario se puede crear bus en company_id de TM.

7) Checklist de integración Front

 Configurar .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.

 Implementar Sign up / Sign in / Sign out llamando a los endpoints de Auth.

 En el Dashboard/vehicles:

 Listar buses consumiendo GET /buses.

 En el modal “Añadir bus”, llamar a POST /buses con el access_token del login.

 Mostrar toasts según errores: 403 (sin permisos), 23505 (placa duplicada), otros -> mensaje genérico.

 (Opcional) Usar POST /rpc/me_profile para mostrar nombre/email del usuario logueado.

8) Próximo paso sugerido (no bloqueante)

v_bus_overview (vista) para devolver en una sola llamada: Bus + asignación activa + última posición + ocupación.
→ Cuando el Front termine lo básico, lo habilitamos.

9) Contacto / dudas

Cualquier 403 al crear bus = revisar membership y rol del usuario contra company_id.
Si necesitan filtros adicionales en el listado, se agregan con PostgREST: ?plate=ilike.*ABC*, ?status=eq.AVAILABLE, etc.