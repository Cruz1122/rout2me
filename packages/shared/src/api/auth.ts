import type { SupabaseClient } from '@supabase/supabase-js';

export async function signUp(
  sb: SupabaseClient,
  input: { email: string; password: string },
) {
  const { data, error } = await sb.auth.signUp(input);
  if (error) throw error;
  return data;
}
export async function signIn(
  sb: SupabaseClient,
  input: { email: string; password: string },
) {
  const { data, error } = await sb.auth.signInWithPassword(input);
  if (error) throw error;
  return data;
}
export async function signOut(sb: SupabaseClient) {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}
export async function currentUser(sb: SupabaseClient) {
  const { data, error } = await sb.auth.getUser();
  if (error) throw error;
  return data.user;
}
