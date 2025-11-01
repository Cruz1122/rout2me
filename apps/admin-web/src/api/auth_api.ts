import { supabaseConfig } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface SignUpResponse {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    phone: string;
  };
}

export async function signUp(data: SignUpData): Promise<SignUpResponse> {
  const { email, password, name, phone } = data;

  const response = await fetch(`${supabaseConfig.url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseConfig.anonKey,
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        name,
        phone,
      },
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error_description || result.msg || 'Error al crear la cuenta',
    );
  }

  return {
    id: result.id,
    email: result.email,
    user_metadata: result.user_metadata,
  };
}

export async function signIn(email: string, password: string) {
  const response = await fetch(
    `${supabaseConfig.url}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseConfig.anonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error_description || result.msg || 'Error al iniciar sesión',
    );
  }

  return result;
}
