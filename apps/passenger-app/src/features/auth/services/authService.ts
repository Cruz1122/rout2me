// Servicio de autenticación para Supabase
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  org_key?: string;
}

export interface SignupResponse {
  ok: boolean;
  user_id?: string;
  email?: string;
  company_id?: string;
  email_sent?: boolean;
  confirm_via?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string | null;
    phone: string;
    phone_confirmed_at: string | null;
    confirmation_sent_at: string | null;
    confirmed_at: string | null;
    recovery_sent_at: string | null;
    last_sign_in_at: string;
    app_metadata: {
      provider: string;
      providers: string[];
    };
    user_metadata: {
      company_key: string;
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
        company_key: string;
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
  };
  weak_password: null;
}

// Interface para la sesión almacenada
export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    user_metadata: {
      company_key: string;
      name: string;
      phone: string;
    };
  };
}

export interface AuthError {
  message: string;
  status?: number;
}

const AUTH_URL = import.meta.env.VITE_BACKEND_AUTH_URL;
const FUNCTIONS_URL = import.meta.env.VITE_BACKEND_FUNCTIONS_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const SERVICE_ROLE_KEY = import.meta.env.VITE_SERVICE_ROLE_KEY;

/**
 * Realiza el registro de un nuevo usuario usando el endpoint de Cloud Functions
 */
export async function signupUser(
  signupData: SignupRequest,
): Promise<SignupResponse> {
  if (!FUNCTIONS_URL || !ANON_KEY) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica las variables de entorno VITE_BACKEND_FUNCTIONS_URL y VITE_ANON_KEY',
    );
  }

  try {
    const response = await fetch(`${FUNCTIONS_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(signupData),
    });

    const responseData = await response.json();

    // Manejar respuestas de error del servidor
    if (!response.ok || !responseData.ok) {
      const errorCode = responseData.error;

      // Traducir códigos de error a mensajes amigables
      if (errorCode === 'invalid_org_key') {
        throw new Error(
          'La clave de organización es inválida. Verifica que sea correcta.',
        );
      } else if (errorCode === 'email_exists') {
        throw new Error(
          'Este correo electrónico ya está registrado. Intenta iniciar sesión o usa otro correo.',
        );
      } else {
        throw new Error(
          errorCode || `Error en el registro: ${response.status}`,
        );
      }
    }

    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido durante el registro');
  }
}

/**
 * Realiza el login de un usuario en Supabase
 */
export async function loginUser(
  loginData: LoginRequest,
): Promise<LoginResponse> {
  if (!AUTH_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica las variables de entorno VITE_BACKEND_AUTH_URL y VITE_SERVICE_ROLE_KEY',
    );
  }

  try {
    const response = await fetch(`${AUTH_URL}/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Manejar errores específicos de login
      if (errorData.error_code === 'invalid_credentials') {
        throw new Error(
          'Correo electrónico o contraseña incorrectos. Por favor, verifica tus credenciales.',
        );
      }

      throw new Error(
        errorData.message ||
          errorData.msg ||
          `Error en el login: ${response.status}`,
      );
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido durante el login');
  }
}

/**
 * Solicita un enlace de recuperación de contraseña
 */
export async function recoverPassword(email: string): Promise<void> {
  if (!AUTH_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica las variables de entorno VITE_BACKEND_AUTH_URL y VITE_SERVICE_ROLE_KEY',
    );
  }

  try {
    const response = await fetch(`${AUTH_URL}/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error en la recuperación de contraseña: ${response.status}`,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido durante la recuperación de contraseña');
  }
}

/**
 * Actualiza la contraseña usando el token de recuperación
 */
export async function updatePasswordWithToken(
  accessToken: string,
  newPassword: string,
): Promise<void> {
  if (!AUTH_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Configuración de autenticación faltante. Verifica las variables de entorno VITE_BACKEND_AUTH_URL y VITE_SERVICE_ROLE_KEY',
    );
  }

  console.log(
    '🔐 updatePasswordWithToken - Iniciando actualización de contraseña',
  );
  console.log('🔐 URL:', `${AUTH_URL}/user`);
  console.log('🔐 Token:', accessToken.substring(0, 20) + '...');

  try {
    const response = await fetch(`${AUTH_URL}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    console.log('🔐 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error response:', errorData);

      // Traducir mensajes comunes de error al español
      let errorMessage =
        errorData.message || errorData.msg || errorData.error_description;

      if (errorMessage) {
        // Traducir mensajes específicos
        if (
          errorMessage
            .toLowerCase()
            .includes('new password should be different')
        ) {
          errorMessage = 'La nueva contraseña debe ser diferente a la anterior';
        } else if (
          errorMessage.toLowerCase().includes('password') &&
          errorMessage.toLowerCase().includes('weak')
        ) {
          errorMessage =
            'La contraseña es muy débil. Debe tener al menos 6 caracteres';
        } else if (
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('expired')
        ) {
          errorMessage = 'El enlace de recuperación ha expirado o es inválido';
        }
      }

      throw new Error(
        errorMessage || `Error al actualizar la contraseña: ${response.status}`,
      );
    }

    console.log('✅ Contraseña actualizada exitosamente');
  } catch (error) {
    console.error('❌ Error al actualizar contraseña:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al actualizar la contraseña');
  }
}

/**
 * Valida la configuración de autenticación
 */
export function validateAuthConfig(): void {
  const requiredEnvVars = [
    'VITE_BACKEND_AUTH_URL',
    'VITE_BACKEND_FUNCTIONS_URL',
    'VITE_ANON_KEY',
    'VITE_SERVICE_ROLE_KEY',
  ];
  const missing = requiredEnvVars.filter((envVar) => !import.meta.env[envVar]);

  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }
}

/**
 * Convierte la respuesta de login a una sesión simplificada para almacenar
 */
export function createAuthSession(loginResponse: LoginResponse): AuthSession {
  return {
    access_token: loginResponse.access_token,
    token_type: loginResponse.token_type,
    expires_in: loginResponse.expires_in,
    expires_at: loginResponse.expires_at,
    refresh_token: loginResponse.refresh_token,
    user: {
      id: loginResponse.user.id,
      aud: loginResponse.user.aud,
      role: loginResponse.user.role,
      email: loginResponse.user.email,
      user_metadata: {
        company_key: loginResponse.user.user_metadata.company_key,
        name: loginResponse.user.user_metadata.name,
        phone: loginResponse.user.user_metadata.phone,
      },
    },
  };
}

/**
 * Servicio de almacenamiento de autenticación con localStorage
 */
export const authStorage = {
  // Claves para localStorage
  SESSION_KEY: 'rout2me_auth_session',
  TIMESTAMP_KEY: 'rout2me_auth_timestamp',

  /**
   * Guarda la sesión de autenticación en localStorage
   */
  saveSession(session: AuthSession): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
      console.log('Sesión guardada exitosamente');
    } catch (error) {
      console.error('Error guardando sesión:', error);
      throw new Error('No se pudo guardar la sesión');
    }
  },

  /**
   * Obtiene la sesión de autenticación desde localStorage
   */
  getSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      return JSON.parse(sessionData) as AuthSession;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      this.clearSession(); // Limpiar datos corruptos
      return null;
    }
  },

  /**
   * Verifica si la sesión actual es válida (no expirada)
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const now = Math.floor(Date.now() / 1000); // Timestamp actual en segundos
    const isValid = session.expires_at > now;

    if (!isValid) {
      console.log('Sesión expirada, limpiando...');
      this.clearSession();
    }

    return isValid;
  },

  /**
   * Limpia la sesión de autenticación
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.TIMESTAMP_KEY);
      console.log('Sesión limpiada');
    } catch (error) {
      console.error('Error limpiando sesión:', error);
    }
  },

  /**
   * Obtiene el token de acceso actual
   */
  getAccessToken(): string | null {
    const session = this.getSession();
    return session?.access_token || null;
  },

  /**
   * Obtiene los datos del usuario actual
   */
  getUser(): AuthSession['user'] | null {
    const session = this.getSession();
    return session?.user || null;
  },

  /**
   * Obtiene el refresh token
   */
  getRefreshToken(): string | null {
    const session = this.getSession();
    return session?.refresh_token || null;
  },

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.isSessionValid();
  },

  /**
   * Obtiene el tiempo restante de la sesión en segundos
   */
  getTimeRemaining(): number {
    const session = this.getSession();
    if (!session) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, session.expires_at - now);
  },
};
