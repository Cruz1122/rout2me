import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno locales antes de leerlas. Esto asegura que
// cualquier test que importe `_client.ts` obtenga `SUPABASE_URL`/keys.
dotenv.config({ path: '.env.local' });

const RUN_INTEGRATION =
  process.env.RUN_SUPABASE_INTEGRATION === '1' || process.env.RUN_SUPABASE_INTEGRATION === 'true';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY || serviceKey;

export const uniq = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export async function must<T>(promise: Promise<{ data: T; error: any }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message || String(error));
  return data!;
}

// Decide si se usa clientes reales o el mock en memoria.
let admin: any;
let anon: any;

if (RUN_INTEGRATION) {
  admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  anon = createClient(url, anonKey, { auth: { persistSession: false } });
} else {
  // Modo mock: cliente en memoria que simula la API básica necesaria por los tests.
  type Row = Record<string, any>;
  const store: Record<string, Row[]> = {};

  function ensureTable(name: string) {
    if (!store[name]) store[name] = [];
    return store[name];
  }

  function applyFilters(rows: Row[], filters: any[]) {
    return rows.filter(r => {
      return filters.every(f => {
        if (f.type === 'eq') return String(r[f.field]) === String(f.value);
        if (f.type === 'in') return (f.values || []).includes(r[f.field]);
        if (f.type === 'ilike') {
          const v = String(r[f.field] || '').toLowerCase();
          const pat = String(f.pattern || '').replace(/%/g, '');
          return v.includes(pat.toLowerCase());
        }
        if (f.type === 'is') {
          // treat undefined as null for tests convenience
          const val = r[f.field] === undefined ? null : r[f.field];
          return (f.value === null && val === null) || Object.is(val, f.value);
        }
        return true;
      });
    });
  }

  class FakeBuilder {
    table: string;
    op: 'select' | 'insert' | 'delete' | 'update' = 'select';
    payload: any = null;
    _select: string | null = null;
    _filters: any[] = [];
    _order: any = null;

    constructor(table: string) { this.table = table; }

  insert(row: Row) { this.op = 'insert'; this.payload = row; return this; }
    delete() { this.op = 'delete'; return this; }
    update(row: Row) { this.op = 'update'; this.payload = row; return this; }
    select(sel: string) { this._select = sel; return this; }
    eq(field: string, value: any) { this._filters.push({ type: 'eq', field, value }); return this; }
    in(field: string, values: any[]) { this._filters.push({ type: 'in', field, values }); return this; }
    ilike(field: string, pattern: string) { this._filters.push({ type: 'ilike', field, pattern }); return this; }
    order(field: string, opts: any) { this._order = { field, opts }; return this; }

    async execute(): Promise<{ data: any; error: any; count?: number }> {
      const tbl = ensureTable(this.table);
      try {
        if (this.op === 'insert') {
          const row = { ...this.payload };
          // simular algunas reglas de negocio/DB para tests
          // restricciones únicas
          if (this.table === 'routes' && row.code) {
            const dup = tbl.find(r => String(r.code) === String(row.code));
            if (dup) return { data: null, error: { message: 'duplicate key', code: '23505' } };
          }
          if (this.table === 'buses' && row.plate) {
            const dup = tbl.find(r => String(r.plate) === String(row.plate));
            if (dup) return { data: null, error: { message: 'duplicate key', code: '23505' } };
            // regla de negocio: capacity > 0
            if (typeof row.capacity === 'number' && row.capacity <= 0) {
              return { data: null, error: { message: 'capacity must be > 0' } };
            }
          }

          if (!row.id) row.id = uniq(this.table).replace(/[^a-zA-Z0-9-_]/g, '');
          tbl.push(row);
          return { data: row, error: null };
        }

        if (this.op === 'delete') {
          const before = tbl.length;
          const toDelete = applyFilters(tbl, this._filters);
          const count = toDelete.length;
          // si hay filtros, eliminar los que coincidan
          if (this._filters.length) {
            const idsToRemove = toDelete.map((r:any) => r.id);
            for (let i = tbl.length -1; i>=0; i--) if (idsToRemove.includes(tbl[i].id)) tbl.splice(i,1);
            return { data: null, error: null, count };
          }
          return { data: null, error: null, count: 0 };
        }

        if (this.op === 'update') {
          const rows = applyFilters(tbl, this._filters);
          const count = rows.length;
          
          // validar las reglas de negocio antes de aplicar la actualización

          if (this.table === 'buses' && this.payload.capacity !== undefined) {
            if (typeof this.payload.capacity === 'number' && this.payload.capacity <= 0) {
              return { data: null, error: { message: 'capacity must be > 0' }, count: 0 };
            }
          }
          
          // validar restricciones unicas para routes.code
          if (this.table === 'routes' && this.payload.code !== undefined) {
            const targetIds = rows.map((r:any) => r.id);
            const dup = tbl.find(r => String(r.code) === String(this.payload.code) && !targetIds.includes(r.id));
            if (dup) return { data: null, error: { message: 'duplicate key', code: '23505' }, count: 0 };
          }
          
          rows.forEach(r => Object.assign(r, this.payload));
          return { data: rows, error: null, count };
        }

        // select
        let rows = [...tbl];
        if (this._filters.length) rows = applyFilters(rows, this._filters);
        if (this._order) {
          const f = this._order.field;
          rows.sort((a,b) => (a[f] > b[f] ? 1 : -1) * (this._order.opts?.ascending ? 1 : -1));
        }
        // project fields if needed
        if (this._select) {
          const fields = this._select.split(',').map(s=>s.trim().split(' ')[0]);
          rows = rows.map(r => {
            const out: any = {};
            fields.forEach((f:any)=>{ if (f in r) out[f]=r[f]; });
            return out;
          });
        }
        return { data: rows, error: null };
      } catch (err:any) {
        return { data: null, error: { message: String(err) } };
      }
    }

    // make the builder thenable so `await builder` works
    then(resolve: any, reject: any) {
      return this.execute().then(resolve, reject);
    }

    // convenience single() - mimic PostgREST single() behavior: if no rows, return an error
    async single() {
      const r = await this.execute();
      const arr = Array.isArray(r.data) ? r.data : (r.data ? [r.data] : []);
      if (!arr || arr.length === 0) return { data: null, error: { message: 'No rows' } };
      return { data: arr[0], error: r.error };
    }

    // maybeSingle() - like supabase-js maybeSingle(): return null data instead of error when no rows
    async maybeSingle() {
      const r = await this.execute();
      const arr = Array.isArray(r.data) ? r.data : (r.data ? [r.data] : []);
      if (!arr || arr.length === 0) return { data: null, error: null };
      return { data: arr[0], error: r.error };
    }
  }

  // add `is` filter helper on the prototype-level by providing method here
  ;(FakeBuilder.prototype as any).is = function(field: string, value: any) { this._filters.push({ type: 'is', field, value }); return this; };

  // Fake auth implementation minimal for tests
  const authUsers: Record<string, any> = {};

  admin = {
    from: (table: string) => new FakeBuilder(table),
    auth: {
      admin: {
        async createUser({ email, password, user_metadata }: any) {
          // simulate unique email constraint
          const users = ensureTable('users');
          const exists = users.find((u:any) => String(u.email).toLowerCase() === String(email).toLowerCase());
          if (exists) {
            return { data: null, error: { message: 'duplicate key', code: '23505' } };
          }

          // basic password policy simulation (optional): enforce minimal checks in mock
          // If ENFORCE_PASSWORD_POLICY is set, return error for weak passwords
          const enforce = process.env.ENFORCE_PASSWORD_POLICY === '1' || process.env.ENFORCE_PASSWORD_POLICY === 'true';
          if (enforce) {
            const tooShort = typeof password === 'string' && password.length < 8;
            const noUpper = typeof password === 'string' && !/[A-Z]/.test(password);
            const noSpecial = typeof password === 'string' && !/[^A-Za-z0-9]/.test(password);
            if (tooShort || noUpper || noSpecial) {
              return { data: null, error: { message: 'password policy violation' } };
            }
          }

          const id = uniq('user').replace(/[^a-zA-Z0-9-_]/g, '');
          users.push({ id, email, password, user_metadata });
          ensureTable('profile').push({ id, email, name: user_metadata?.name || null });
          ensureTable('user_roles').push({ id: uniq('ur'), user_id: id, role: 'USER' });
          authUsers[email] = { id, password };
          return { data: { user: { id, email } }, error: null };
        },
        async deleteUser(id: string) {
          const users = ensureTable('users');
          for (let i=users.length-1;i>=0;i--) if (users[i].id === id) users.splice(i,1);
          // cascade deletes in other tables (simple)
          const profiles = ensureTable('profile'); for (let i=profiles.length-1;i>=0;i--) if (profiles[i].id===id) profiles.splice(i,1);
          return { data: null, error: null };
        }
      }
    }
  } as any;

  anon = {
    from: (table: string) => new FakeBuilder(table),
    auth: {
      async signInWithPassword({ email, password }: any) {
        const u = ensureTable('users').find(u => u.email === email && u.password === password);
        if (!u) return { data: null, error: { message: 'Invalid credentials' } };
        return { data: { session: { access_token: `token-${u.id}` }, user: { id: u.id } }, error: null };
      }
    }
  } as any;
}

export { admin, anon };
