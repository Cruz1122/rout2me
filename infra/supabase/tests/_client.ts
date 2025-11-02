import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno locales antes de leerlas. Esto asegura que
// cualquier test que importe `_client.ts` obtenga `SUPABASE_URL`/keys.
dotenv.config({ path: '.env.local' });

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY || serviceKey;

export const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
export const anon = createClient(url, anonKey, { auth: { persistSession: false } });

export const uniq = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random()*10000)}`;

export async function must<T>(promise: Promise<{ data: T; error: any }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message || String(error));
  return data!;
}
