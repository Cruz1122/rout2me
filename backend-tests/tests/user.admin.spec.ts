import { describe, test, it, afterAll, expect } from "vitest";
import { admin, anon, randEmail, SUPABASE_URL, ANON_KEY, TEST_COMPANYKEY } from "./helpers/supabase";

async function restGET(path: string, token: string) {
  const url = `${SUPABASE_URL.replace("/project", "")}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function restPATCH(path: string, token: string, body: any) {
  const url = `${SUPABASE_URL.replace("/project", "")}/rest/v1/${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

describe("Users CRUD (Supabase Auth + DB)", () => {
  const password = "S3gura!123";
  const email1 = randEmail("qa.user1");
  const emailDup = email1; // for duplicate test
  const emailOther = randEmail("qa.other");
  let user1Id = "";
  let otherId = "";
  let accessToken = "";

  it("Create user (Admin API) -> profile + USER role", async () => {
    const meta: Record<string, any> = { name: "QA User1", phone: "+573001112233" };
    if (TEST_COMPANYKEY) meta.companykey = TEST_COMPANYKEY;

    const { data: created, error } = await admin.auth.admin.createUser({
      email: email1,
      password,
      email_confirm: true,
      user_metadata: meta
    });
    expect(error).toBeNull();
    expect(created?.user?.id).toBeDefined();
    user1Id = created!.user!.id;

    // profile existe
    const { data: prof } = await admin.from("profile").select("id,email").eq("email", email1).maybeSingle();
    expect(prof?.id).toBe(user1Id);

    // rol USER asignado
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user1Id);
    const roleNames = (roles ?? []).map((r: any) => r.role);
    expect(roleNames).toContain("USER");

    // si definiste TEST_COMPANYKEY, debería existir una membresía
    if (TEST_COMPANYKEY) {
      const { data: mem } = await admin.from("memberships").select("company_id, org_role").eq("user_id", user1Id);
      expect((mem ?? []).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("Duplicate email (Admin API) should fail", async () => {
    const { error } = await admin.auth.admin.createUser({
      email: emailDup,
      password,
      email_confirm: true,
      user_metadata: { name: "Dup" }
    });
    expect(error).toBeTruthy(); // ya existe
  });

  it("Login with password and get access token", async () => {
    const { data, error } = await anon.auth.signInWithPassword({ email: email1, password });
    expect(error).toBeNull();
    expect(data.session?.access_token).toBeDefined();
    expect(data.user?.id).toBe(user1Id);
    accessToken = data.session!.access_token!;
  });

  it("RLS: see only my own profile", async () => {
    // create other user (admin)
    const { data: other } = await admin.auth.admin.createUser({
      email: emailOther,
      password,
      email_confirm: true,
      user_metadata: { name: "Other" }
    });
    otherId = other!.user!.id;

    // GET my own
    const mine = await restGET(`profile?id=eq.${user1Id}&select=id,email,name`, accessToken);
    expect(mine.status).toBe(200);
    expect(Array.isArray(mine.data)).toBe(true);
    expect(mine.data.length).toBe(1);
    expect(mine.data[0].id).toBe(user1Id);

    // Try read someone else
    const notAllowed = await restGET(`profile?id=eq.${otherId}&select=id,email`, accessToken);
    expect(notAllowed.status).toBe(200);
    expect(Array.isArray(notAllowed.data)).toBe(true);
    expect(notAllowed.data.length).toBe(0); // RLS
  });

  it("Update my profile (PATCH REST with my token)", async () => {
    const phone = "+573009998877";
    const upd = await restPATCH(`profile?id=eq.${user1Id}`, accessToken, { phone, updated_at: "now()" });
    expect(upd.status).toBeGreaterThanOrEqual(200);
    expect(upd.status).toBeLessThan(300);
    expect(Array.isArray(upd.data)).toBe(true);
    expect(upd.data[0].phone).toBe(phone);
  });

  afterAll(async () => {
    // Cleanup (si no usas ON DELETE CASCADE, borra dependencias primero)
    if (otherId) await admin.auth.admin.deleteUser(otherId);
    if (user1Id) await admin.auth.admin.deleteUser(user1Id);
  });
});
