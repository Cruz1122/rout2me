import { supabaseConfig, supabase } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  org_key?: string;
}

export interface SignUpResponse {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    phone?: string;
  };
}

export async function signUp(data: SignUpData): Promise<SignUpResponse> {
  const { email, password, name, phone, org_key } = data;

  const body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    org_key?: string;
  } = {
    email,
    password,
    name,
  };

  // Agregar campos opcionales solo si tienen valor
  if (phone && phone.trim()) {
    body.phone = phone;
  }
  if (org_key && org_key.trim()) {
    body.org_key = org_key;
  }

  const response = await fetch(`${supabaseConfig.url}/functions/v1/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseConfig.anonKey}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || result.message || 'Error al crear la cuenta',
    );
  }

  return result;
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
    // Traducir mensajes de error comunes
    let errorMessage =
      result.error_description || result.msg || 'Error al iniciar sesión';

    if (
      errorMessage === 'Invalid login credentials' ||
      errorMessage.includes('credentials')
    ) {
      errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
    }

    throw new Error(errorMessage);
  }

  // Validar el rol del usuario
  const user = result.user;
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true;
  const orgRole = user?.user_metadata?.orgs?.[0]?.org_role;

  // Permitir solo ADMIN o superadmin
  if (!isSuperAdmin && orgRole !== 'ADMIN') {
    throw new Error(
      'No tienes permisos para acceder a esta aplicación. Solo administradores pueden iniciar sesión.',
    );
  }

  return result;
}

export async function recoverPassword(email: string): Promise<void> {
  const response = await fetch(`${supabaseConfig.url}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseConfig.anonKey,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(
      result.error_description || result.msg || 'Error al enviar el correo',
    );
  }
}

export async function resetPassword(
  accessToken: string,
  newPassword: string,
): Promise<void> {
  const response = await fetch(`${supabaseConfig.url}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseConfig.anonKey,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(
      result.error_description ||
        result.msg ||
        'Error al restablecer la contraseña',
    );
  }
}

export async function changePassword(
  accessToken: string,
  newPassword: string,
  email: string,
  name: string,
  phone?: string,
): Promise<void> {
  // Usamos el endpoint /auth/v1/user para que el usuario actualice su propia información
  const body: {
    email: string;
    password: string;
    data: {
      name: string;
      phone?: string;
    };
  } = {
    email,
    password: newPassword,
    data: {
      name,
    },
  };

  if (phone && phone.trim()) {
    body.data.phone = phone;
  }

  const response = await fetch(`${supabaseConfig.url}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseConfig.anonKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(
      result.error_description ||
        result.msg ||
        'Error al cambiar la contraseña',
    );
  }
}

// Función para iniciar sesión con Google
export async function signInWithGoogle(): Promise<void> {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      skipBrowserRedirect: false,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al iniciar sesión con Google');
  }
}

/**
 * Inicia sesión con Microsoft usando OAuth
 */
export async function signInWithMicrosoft(): Promise<void> {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      skipBrowserRedirect: false,
      scopes: 'email openid profile',
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al iniciar sesión con Microsoft');
  }
}
