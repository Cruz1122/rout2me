// Servicio para obtener información del usuario

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
