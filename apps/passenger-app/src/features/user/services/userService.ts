// Servicio para obtener información del usuario

export type OrgRole = 'USER' | 'DRIVER' | 'ADMIN';

export interface Organization {
  company_id: string;
  company_name: string;
  org_key: string;
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
const REST_URL = import.meta.env.VITE_BACKEND_REST_URL;
const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
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

export interface LeaveOrganizationResponse {
  ok: boolean;
  message: string;
  company_id: string;
  short_name: string;
  company_name: string;
  already_left?: boolean;
  org_role?: OrgRole;
  status?: string;
}

/**
 * Abandona una organización usando el org_key
 */
export async function leaveOrganization(
  accessToken: string,
  orgKey: string,
): Promise<LeaveOrganizationResponse> {
  // Validaciones rápidas (reducir complejidad agrupando)
  if (!REST_URL || !ANON_KEY) {
    throw new Error('Configuración de API faltante (REST_URL o ANON_KEY)');
  }
  if (!accessToken) throw new Error('Token de acceso no proporcionado');
  if (!orgKey) throw new Error('Clave de organización no proporcionada');

  try {
    const response = await fetch(`${REST_URL}/rpc/org_leave_by_key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ p_org_key: orgKey }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: UserServiceError = {
        message:
          errorData.message ||
          `Error al abandonar la organización: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }

    // Intentar parsear JSON de forma segura (algunos RPC pueden devolver 204 o texto vacío)
    const data = await safeParseLeaveResponse(response);
    // eslint-disable-next-line no-console
    console.log('[leaveOrganization] response data:', data);
    return data;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al abandonar la organización',
    );
  }
}

// Extraer lógica de parseo para reducir complejidad
async function safeParseLeaveResponse(
  response: Response,
): Promise<LeaveOrganizationResponse> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const json = (await response.json()) as LeaveOrganizationResponse;
      return json;
    } catch {
      /* continuar a fallback */
    }
  } else {
    try {
      const raw = await response.text();
      if (raw) {
        return JSON.parse(raw) as LeaveOrganizationResponse;
      }
    } catch {
      /* continuar a fallback */
    }
  }
  return {
    ok: true,
    message: 'left',
    company_id: '',
    short_name: '',
    company_name: '',
  };
}

export interface JoinOrganizationResponse {
  ok: boolean;
  status: string;
  org_role: OrgRole;
  company_id: string;
  short_name: string;
  company_name: string;
  membership_id: string;
}

/**
 * Se une a una organización usando la clave de la organización
 */
export async function joinOrganization(
  accessToken: string,
  orgKey: string,
): Promise<JoinOrganizationResponse> {
  if (!REST_URL) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_BACKEND_REST_URL',
    );
  }

  if (!ANON_KEY) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_ANON_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  if (!orgKey) {
    throw new Error('Clave de organización no proporcionada');
  }

  try {
    const response = await fetch(`${REST_URL}/rpc/org_join_by_key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ p_org_key: orgKey }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: UserServiceError = {
        message:
          errorData.message ||
          `Error al unirse a la organización: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }

    const data: JoinOrganizationResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al unirse a la organización',
    );
  }
}

export interface UpdateProfileData {
  _name?: string;
  _phone?: string;
  _avatar_url?: string;
}

/**
 * Optimiza y convierte una imagen a PNG
 */
async function optimizeImageToPng(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo crear el contexto del canvas'));
      return;
    }

    img.onload = () => {
      // Tamaño máximo de 800px en cualquier dimensión
      const maxSize = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar la imagen optimizada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a PNG con calidad
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo convertir la imagen a PNG'));
          }
        },
        'image/png',
        0.9,
      );
    };

    img.onerror = () => {
      reject(new Error('No se pudo cargar la imagen'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Sube un avatar usando la función Edge de Supabase
 */
export async function uploadAvatar(
  accessToken: string,
  file: File,
): Promise<string> {
  if (!BASE_URL) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_BACKEND_BASE_URL',
    );
  }

  if (!ANON_KEY) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_ANON_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  try {
    // Optimizar y convertir la imagen a PNG
    const optimizedBlob = await optimizeImageToPng(file);

    // Subir el archivo usando la función Edge
    const response = await fetch(`${BASE_URL}/functions/v1/update_avatar`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'image/png',
      },
      body: optimizedBlob,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: UserServiceError = {
        message:
          errorData.message || `Error al subir el avatar: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }

    // La función Edge retorna la URL del avatar
    const result = await response.json();
    return result.avatar_url || result.url;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al subir el avatar',
    );
  }
}

/**
 * Actualiza el perfil del usuario actual
 */
export async function updateMyProfile(
  accessToken: string,
  profileData: UpdateProfileData,
): Promise<UserResponse> {
  if (!REST_URL) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_BACKEND_REST_URL',
    );
  }

  if (!PUBLISHABLE_KEY) {
    throw new Error(
      'Configuración de API faltante. Verifica la variable de entorno VITE_PUBLISHABLE_KEY o VITE_SERVICE_ROLE_KEY',
    );
  }

  if (!accessToken) {
    throw new Error('Token de acceso no proporcionado');
  }

  try {
    const response = await fetch(`${REST_URL}/rpc/update_my_profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const serviceError: UserServiceError = {
        message:
          errorData.message ||
          `Error al actualizar el perfil: ${response.status}`,
        status: response.status,
      };
      throw serviceError;
    }

    const updatedUser = await response.json();
    return updatedUser;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error desconocido al actualizar el perfil',
    );
  }
}
