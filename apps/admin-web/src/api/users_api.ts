// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export type UserRole = 'ADMIN' | 'USER' | 'DRIVER';

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: UserRole;
  company_name?: string;
  company_id?: string;
  is_superadmin?: boolean;
  created_at: string;
  email_confirmed_at?: string;
};

export type UserCreate = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company_id: string;
  org_role: UserRole;
  is_superadmin?: boolean;
};

export type UserUpdate = {
  user_id: string;
  email: string;
  password?: string;
  user_metadata: {
    name: string;
    phone?: string;
  };
  company_id: string;
  org_role: UserRole;
};

export type UserWithRole = {
  user_id: string;
  role: UserRole;
};

// Obtener todos los usuarios
export async function getUsers(): Promise<User[]> {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?per_page=50&page=1`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Get users error:', errorText);
    throw new Error(`Get users failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();

  // La respuesta tiene estructura { users: [...], aud: "..." }
  const usersArray = data.users || [];

  return usersArray.map(
    (user: {
      id: string;
      email: string;
      user_metadata?: {
        name?: string;
        phone?: string;
        orgs?: Array<{
          org_role?: string;
          company_name?: string;
          company_id?: string;
        }>;
        is_superadmin?: boolean;
      };
      created_at: string;
      email_confirmed_at?: string;
    }) => ({
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || 'Sin nombre',
      phone: user.user_metadata?.phone || '',
      role: (user.user_metadata?.orgs?.[0]?.org_role as UserRole) || 'USER',
      company_name: user.user_metadata?.orgs?.[0]?.company_name || '',
      company_id: user.user_metadata?.orgs?.[0]?.company_id || '',
      is_superadmin: user.user_metadata?.is_superadmin || false,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
    }),
  );
}

// Obtener el rol de un usuario específico
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/user_roles?select=user_id,role&user_id=eq.${userId}`,
    {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    console.error('Get user role error');
    return null;
  }

  const roles: UserWithRole[] = await res.json();
  return roles.length > 0 ? roles[0].role : null;
}

// Crear un nuevo usuario usando el endpoint admin_create_user
export async function createUser(payload: UserCreate): Promise<User> {
  const url = `${SUPABASE_URL}/functions/v1/admin_create_user`;
  const token = localStorage.getItem('access_token');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Create user error:', errorText);

    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(
        errorJson.error ||
          errorJson.message ||
          `Create user failed: ${res.status}`,
      );
    } catch (e) {
      if (e instanceof Error && e.message.includes('error')) {
        throw e;
      }
      throw new Error(`Create user failed: ${res.status} ${errorText}`);
    }
  }

  const result = await res.json();

  // La respuesta devuelve: { ok, user_id, email, company_id, org_role, global_role }
  return {
    id: result.user_id,
    email: result.email,
    name: payload.name,
    phone: payload.phone || '',
    role: result.org_role as UserRole,
    company_name: '',
    company_id: result.company_id,
    is_superadmin: payload.is_superadmin || false,
    created_at: new Date().toISOString(),
    email_confirmed_at: undefined,
  };
}

// Actualizar un usuario existente usando el endpoint admin_update_user
export async function updateUser(payload: UserUpdate): Promise<User> {
  const url = `${SUPABASE_URL}/functions/v1/admin_update_user`;
  const token = localStorage.getItem('access_token');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Update user error:', errorText);

    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(
        errorJson.error ||
          errorJson.message ||
          `Update user failed: ${res.status}`,
      );
    } catch (e) {
      if (e instanceof Error && e.message.includes('error')) {
        throw e;
      }
      throw new Error(`Update user failed: ${res.status} ${errorText}`);
    }
  }

  const result = await res.json();

  // Si la respuesta es similar a create, adaptamos
  if (result.user) {
    const updatedUser = result.user;
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.user_metadata?.name || '',
      phone: updatedUser.user_metadata?.phone || '',
      role:
        (updatedUser.user_metadata?.orgs?.[0]?.org_role as UserRole) || 'USER',
      company_name: updatedUser.user_metadata?.orgs?.[0]?.company_name || '',
      company_id: updatedUser.user_metadata?.orgs?.[0]?.company_id || '',
      is_superadmin: updatedUser.user_metadata?.is_superadmin || false,
      created_at: updatedUser.created_at,
      email_confirmed_at: updatedUser.email_confirmed_at,
    };
  }

  // Si devuelve formato simplificado como create
  return {
    id: payload.user_id,
    email: payload.email,
    name: payload.user_metadata.name,
    phone: payload.user_metadata.phone || '',
    role: payload.org_role,
    company_name: '',
    company_id: payload.company_id,
    is_superadmin: false,
    created_at: new Date().toISOString(),
    email_confirmed_at: undefined,
  };
}

// Eliminar un usuario
export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete user failed: ${res.status} ${text}`);
  }
}
