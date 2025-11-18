// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export type UserRole = 'ADMIN' | 'USER' | 'DRIVER' | 'SUPERVISOR' | 'PASSENGER';

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: UserRole;
  company_name?: string;
  is_superadmin?: boolean;
  created_at: string;
  email_confirmed_at?: string;
};

export type UserCreate = {
  email: string;
  password: string;
  email_confirm: boolean;
  user_metadata: {
    name: string;
    phone: string;
  };
};

export type UserUpdate = {
  email?: string;
  password?: string;
  user_metadata?: {
    name?: string;
    phone?: string;
  };
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
        orgs?: Array<{ org_role?: string; company_name?: string }>;
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

// Crear un nuevo usuario (Admin endpoint)
export async function createUser(payload: UserCreate): Promise<User> {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Create user error:', errorText);

    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(
        `Create user failed: ${errorJson.message || errorJson.code || errorText}`,
      );
    } catch {
      throw new Error(`Create user failed: ${res.status} ${errorText}`);
    }
  }

  const newUser = await res.json();

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.user_metadata?.name || '',
    phone: newUser.user_metadata?.phone || '',
    role: (newUser.user_metadata?.orgs?.[0]?.org_role as UserRole) || 'USER',
    company_name: newUser.user_metadata?.orgs?.[0]?.company_name || '',
    is_superadmin: newUser.user_metadata?.is_superadmin || false,
    created_at: newUser.created_at,
    email_confirmed_at: newUser.email_confirmed_at,
  };
}

// Actualizar un usuario existente
export async function updateUser(
  userId: string,
  payload: UserUpdate,
): Promise<User> {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${userId}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Update user error:', errorText);

    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(
        `Update user failed: ${errorJson.message || errorJson.code || errorText}`,
      );
    } catch {
      throw new Error(`Update user failed: ${res.status} ${errorText}`);
    }
  }

  const updatedUser = await res.json();

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.user_metadata?.name || '',
    phone: updatedUser.user_metadata?.phone || '',
    role:
      (updatedUser.user_metadata?.orgs?.[0]?.org_role as UserRole) || 'USER',
    company_name: updatedUser.user_metadata?.orgs?.[0]?.company_name || '',
    is_superadmin: updatedUser.user_metadata?.is_superadmin || false,
    created_at: updatedUser.created_at,
    email_confirmed_at: updatedUser.email_confirmed_at,
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
