import { describe, it, expect } from 'vitest';
import { admin, uniq, must } from './_client';

/**
 * Helper local que simula el flujo público de registro (signup).
 * - Si se pasa org_key, valida existencia de la compañía antes de crear el usuario.
 * - No escribe en la BD real porque `admin` proviene del mock `./_client`.
 */
async function registerUser({ email, password, name, org_key }: { email: string; password: string; name?: string; org_key?: string }) {
  // si viene org_key, verificar existencia
  if (org_key) {
    const { data: comps } = await admin.from('companies').select('id, company_key').eq('company_key', org_key);
    if (!comps || comps.length === 0) {
      return { success: false, error: { message: 'company_key not found' } };
    }
  }

  // Crear usuario vía Admin API (mock)
  const res = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (res.error) return { success: false, error: res.error };
  const user = res.data.user;

  // si org_key válido, crear membership (simulado)
  if (org_key) {
    const { data: comps } = await admin.from('companies').select('id').eq('company_key', org_key).maybeSingle();
    if (comps && comps.id) {
      await admin.from('memberships').insert({ id: uniq('memb'), user_id: user.id, company_id: comps.id, org_role: 'VIEWER' });
    }
  }

  return { success: true, user };
}

describe('Signup flows (mocked)', () => {
  it('usuario normal se puede registrar sin org_key', async () => {
    const email = `${uniq('signup')}@example.com`;
    const password = 'S3gura!123';

    const result = await registerUser({ email, password, name: 'Normal User' });
    expect(result.success).toBe(true);
    const uid = result.user.id;

    // verificar profile creado en mock
    const { data: prof } = await admin.from('profile').select('id,email').eq('email', email).maybeSingle();
    expect(prof).toBeTruthy();
    expect(prof.id).toBe(uid);

    // memberships no debe existir
    const { data: mems } = await admin.from('memberships').select('id').eq('user_id', uid);
    expect(mems && mems.length).toBe(0);
  });

  it('usuario normal se puede registrar con org_key válida', async () => {
    // crear company en mock
    const compKey = `ACME-${Math.floor(Math.random()*10000)}`;
    const comp = await must(admin.from('companies').insert({ id: uniq('comp'), name: 'ACME Inc', company_key: compKey }).single());

    const email = `${uniq('signup-org')}@example.com`;
    const password = 'S3gura!123';

  const result = await registerUser({ email, password, name: 'Org User', org_key: compKey });
    expect(result.success).toBe(true);
    const uid = result.user.id;

    // profile creado
    const { data: prof } = await admin.from('profile').select('id,email').eq('email', email).maybeSingle();
    expect(prof).toBeTruthy();

    // membership creada
    const { data: mems } = await admin.from('memberships').select('id,company_id').eq('user_id', uid);
    expect(mems && mems.length).toBeGreaterThanOrEqual(1);
  });

  it('usuario normal con org_key inválida no puede registrarse', async () => {
    const email = `${uniq('signup-bad')}@example.com`;
    const password = 'S3gura!123';

    const result = await registerUser({ email, password, name: 'Bad Org', org_key: 'NO-EXISTE' });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();

    // asegurar que no existe usuario creado con ese email
    const { data: u } = await admin.from('users').select('id').eq('email', email);
    expect(u && u.length).toBe(0);
  });
});
