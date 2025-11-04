import { describe, it, expect, afterAll } from "vitest";
import {
  admin, anon, randEmail, TEST_COMPANYKEY,
  restAdmin, restUser
} from "./helpers/supabase";

describe("REST CRUD - profile/users via Supabase", () => {
  const password = "S3gura!123";
  const email = randEmail("qa.crud");
  let userId = "";
  let accessToken = "";

  // CREATE (admin) – precondición para el CRUD
  it("CREATE (admin) -> user + profile + role USER", async () => {
    const meta: Record<string, any> = { name: "QA CRUD", phone: "+573001112233" };
    if (TEST_COMPANYKEY) meta.companykey = TEST_COMPANYKEY;

    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: meta
    });
    expect(error).toBeNull();
    expect(created?.user?.id).toBeDefined();
    userId = created!.user!.id;

    // login para las pruebas de RLS
    const { data: login, error: eLogin } = await anon.auth.signInWithPassword({ email, password });
    expect(eLogin).toBeNull();
    accessToken = login.session!.access_token!;
  });

  // GET (lista, admin)
  it("GET list (admin) -> should include the created user", async () => {
    const q = `profile?select=id,email,name,created_at&order=created_at.desc&limit=50`;
    const { status, data } = await restAdmin(q, "GET");
    expect(status).toBe(200);
    const ids = (data as any[]).map(r => r.id);
    expect(ids).toContain(userId);
  });

  // GET by ID (admin)
  it("GET by ID (admin)", async () => {
    const { status, data } = await restAdmin(`profile?id=eq.${userId}&select=id,email,name,phone`, "GET");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(userId);
    expect(data[0].email).toBe(email);
  });

  // GET (self, RLS)
  it("GET my profile (self, RLS)", async () => {
    const { status, data } = await restUser(`profile?select=id,email,name`, "GET", accessToken);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    // por RLS sólo debe verse 1 fila propia
    const mine = (data as any[]).find(r => r.id === userId);
    expect(mine).toBeDefined();
  });

  // UPDATE (PATCH) (self)
  it("UPDATE (PATCH) my profile (self)", async () => {
    const phone = "+573000001111";
    const { status, data } = await restUser(`profile?id=eq.${userId}`, "PATCH", accessToken, {
      phone,
      updated_at: "now()"
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].phone).toBe(phone);
  });

  // “PUT-like” UPSERT (admin): PostgREST no soporta PUT; se usa POST + upsert
  it("UPSERT (POST + on_conflict) as PUT-like (admin)", async () => {
    const body = {
      id: userId,
      email,
      name: "QA CRUD Upsert"
    };
    const path = `profile?on_conflict=id`; // constraint PK
    const { status, data } = await restAdmin(path, "POST", body);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300); // POST exitoso (200 para update, 201 para create)
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name).toBe("QA CRUD Upsert");
    expect(data[0].id).toBe(userId);
  });

  // DELETE (admin)
  it("DELETE user (admin)", async () => {
    // Si configuraste ON DELETE CASCADE en profile/memberships/user_roles, basta borrar en Auth.
    const { error } = await admin.auth.admin.deleteUser(userId);
    expect(error).toBeNull();

    // Verifica que ya no exista el profile
    const { status, data } = await restAdmin(`profile?id=eq.${userId}`, "GET");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  // Limpieza en caso de que algún test falle antes del DELETE
  afterAll(async () => {
    if (userId) {
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch {
        // Usuario ya eliminado o no existe, ignorar
      }
    }
  });
});
