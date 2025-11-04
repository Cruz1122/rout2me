import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const ANON_KEY = process.env.SUPABASE_ANON_KEY!;
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const TEST_COMPANYKEY = process.env.TEST_COMPANYKEY || "";

// Endpoints REST
export const REST_URL = `${SUPABASE_URL}/rest/v1`;

export const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const anon: SupabaseClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export function randEmail(prefix = "qa"): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}+${t}_${r}@example.com`;
}

// -------- REST helpers --------
export async function restAdmin(
  path: string,
  method: "GET" | "PATCH" | "POST" | "DELETE",
  body?: any,
) {
  // Ajustar Prefer para operaciones de upsert (POST + on_conflict)
  const prefers: string[] = ["return=representation"];
  if (method === "POST" && path.includes("on_conflict")) {
    // PostgREST requiere resolución para merges en upsert
    prefers.unshift("resolution=merge-duplicates");
  }

  const res = await fetch(`${REST_URL}/${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefers.join(", ")
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await (res.status === 204 ? Promise.resolve(null) : res.json());
  return { status: res.status, data };
}

export async function restUser(
  path: string,
  method: "GET" | "PATCH",
  accessToken: string,
  body?: any,
) {
  const res = await fetch(`${REST_URL}/${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await (res.status === 204 ? Promise.resolve(null) : res.json());
  return { status: res.status, data };
}
