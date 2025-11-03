// Servicio para obtener información del usuario

export type OrgRole = 'USER' | 'DRIVER' | 'ADMIN';

export interface Organization {
  company_id: string;
  company_name: string;
  org_role: OrgRole;
  short_name: string;
}

export interface UserResponse {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    company_key?: string;
    email: string;
    email_verified: boolean;
    name: string;
    phone: string;
    phone_verified: boolean;
    sub: string;
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    orgs?: Organization[];
    primary_company_id?: string | null;
    is_superadmin?: boolean;
  };
  identities: Array<{
    identity_id: string;
    id: string;
    user_id: string;
    identity_data: {
      company_key?: string;
      email: string;
      email_verified: boolean;
      name: string;
      phone: string;
      phone_verified: boolean;
      sub: string;
      avatar_url?: string;
      picture?: string;
      full_name?: string;
      orgs?: Organization[];
      primary_company_id?: string | null;
      is_superadmin?: boolean;
    };
    provider: string;
    last_sign_in_at: string;
    created_at: string;
    updated_at: string;
    email: string;
  }>;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
}

export interface UserServiceError {
  message: string;
  status?: number;
}

const AUTH_URL = import.meta.env.VITE_BACKEND_AUTH_URL;
const PUBLISHABLE_KEY =
  import.meta.env.VITE_PUBLISHABLE_KEY || import.meta.env.VITE_SERVICE_ROLE_KEY;

/**
 * Obtiene la información del usuario actual desde el endpoint /user
 */
export async function getUserInfo(accessToken: string): Promise<UserResponse> {
  if (!AUTH_URL) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica la variable de entorno VITE_BACKEND_AUTH_URL',
    );
  }

  if (!PUBLISHABLE_KEY) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica la variable de entorno VITE_PUBLISHABLE_KEY o VITE_SERVICE_ROLE_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  try {
    const response = await fetch(`${AUTH_URL}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: UserServiceError = {
        message:
          errorData.message ||
          `Error al obtener información del usuario: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al obtener información del usuario',
    );
  }
}

/**
 * Actualiza la contraseña del usuario actual
 */
export async function updatePassword(
  accessToken: string,
  newPassword: string,
): Promise<void> {
  if (!AUTH_URL) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica la variable de entorno VITE_BACKEND_AUTH_URL',
    );
  }

  if (!PUBLISHABLE_KEY) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica la variable de entorno VITE_PUBLISHABLE_KEY o VITE_SERVICE_ROLE_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    const response = await fetch(`${AUTH_URL}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: UserServiceError = {
        message:
          errorData.message ||
          `Error al actualizar la contraseña: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al actualizar la contraseña',
    );
  }
}

/**
 * Formatea la fecha de creación del usuario para mostrar "Usuario desde [mes] [año]"
 */
export function formatUserSinceDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `Usuario desde ${month} ${year}`;
  } catch {
    return 'Usuario desde fecha desconocida';
  }
}

/**
 * Obtiene la organización principal del usuario
 */
export function getPrimaryOrganization(
  userInfo: UserResponse,
): Organization | null {
  const orgs = userInfo.user_metadata?.orgs;
  if (!orgs || orgs.length === 0) {
    return null;
  }

  const primaryCompanyId = userInfo.user_metadata?.primary_company_id;
  if (primaryCompanyId) {
    const primaryOrg = orgs.find((org) => org.company_id === primaryCompanyId);
    if (primaryOrg) {
      return primaryOrg;
    }
  }

  // Si no hay primary_company_id o no se encuentra, devolver la primera organización
  return orgs[0];
}

/**
 * Traduce el rol de la organización al español
 */
export function translateOrgRole(role: OrgRole): string {
  const translations: Record<OrgRole, string> = {
    USER: 'Usuario',
    DRIVER: 'Conductor',
    ADMIN: 'Administrador',
  };
  return translations[role] || role;
}
