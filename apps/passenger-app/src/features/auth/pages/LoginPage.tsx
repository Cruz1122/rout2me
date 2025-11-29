import { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { Browser } from '@capacitor/browser';
import type { PluginListenerHandle } from '@capacitor/core';
import { RiGoogleFill, RiMicrosoftFill, RiArrowLeftLine } from 'react-icons/ri';
import R2MInput from '../../../shared/components/R2MInput';
import R2MButton from '../../../shared/components/R2MButton';
import R2MTextLink from '../../../shared/components/R2MTextLink';
import R2MErrorToast from '../../../shared/components/R2MErrorToast';
import useErrorNotification from '../../system/hooks/useErrorNotification';
import {
  loginUser,
  validateAuthConfig,
  loginWithGoogle,
  loginWithMicrosoft,
} from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const router = useIonRouter();
  const { login } = useAuth();
  const { error, handleError, clearError } = useErrorNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que los campos no estén vacíos
    if (!email.trim() || !password.trim()) {
      handleError(new Error('Por favor, completa todos los campos'));
      return;
    }

    setIsLoading(true);

    try {
      // Validar configuración de autenticación
      validateAuthConfig();

      // Realizar el login con Supabase
      const loginData = {
        email: email.trim(),
        password: password,
      };

      const response = await loginUser(loginData);

      // Guardar sesión en localStorage usando el hook
      login(response);

      // Redirigir directamente a /inicio
      router.push('/inicio', 'forward');
    } catch (error) {
      console.error('Error en el login:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await loginWithGoogle();
    } catch (error) {
      console.error('Error en login con Google:', error);
      handleError(error);
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsMicrosoftLoading(true);
      await loginWithMicrosoft();
    } catch (error) {
      console.error('Error en login con Microsoft:', error);
      handleError(error);
      setIsMicrosoftLoading(false);
    }
  };

  // Manejar el foco cuando la vista entra completamente
  useIonViewDidEnter(() => {
    // Habilitar el botón de retroceso para navegación por teclado
    if (backButtonRef.current) {
      backButtonRef.current.tabIndex = 0;
    }
  });

  // Inicializar listeners para limpiar los loaders cuando el navegador nativo se cierra
  useEffect(() => {
    let browserFinishedListener: PluginListenerHandle | null = null;

    Browser.addListener('browserFinished', () => {
      setIsGoogleLoading(false);
      setIsMicrosoftLoading(false);
    })
      .then((listener) => {
        browserFinishedListener = listener;
      })
      .catch(() => {
        // ignorar si el plugin no está disponible en web
      });

    return () => {
      browserFinishedListener?.remove();
    };
  }, []);

  // Inicializar el botón de retroceso como no focusable hasta que la página esté visible
  useEffect(() => {
    if (backButtonRef.current) {
      backButtonRef.current.tabIndex = -1;
    }

    // Observar cambios en aria-hidden del ancestro para quitar el foco cuando la página se oculta
    const button = backButtonRef.current;
    if (!button) return;

    const observer = new MutationObserver(() => {
      const page = button.closest('.ion-page');
      if (page?.getAttribute('aria-hidden') === 'true') {
        // Si la página se oculta y este botón tiene el focus, quitarlo
        if (document.activeElement === button) {
          button.blur();
        }
        // Deshabilitar el botón mientras está oculto
        button.tabIndex = -1;
      }
    });

    // Observar cambios en el ancestro .ion-page
    const page = button.closest('.ion-page');
    if (page) {
      observer.observe(page, {
        attributes: true,
        attributeFilter: ['aria-hidden'],
      });
    }

    return () => {
      observer.disconnect();
      // Asegurar que el botón pierde el focus al desmontarse
      if (document.activeElement === button) {
        button.blur();
      }
    };
  }, []);

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="ion-padding"
        style={{ '--background': 'var(--color-bg)' }}
      >
        {/* Notificación de error */}
        <R2MErrorToast error={error} onClose={clearError} />
        {/* Botón de retroceso */}
        <button
          ref={backButtonRef}
          onClick={() => router.push('/welcome', 'back')}
          className="absolute top-4 left-4 z-5 p-2 transition-colors"
          style={{
            backgroundColor: 'transparent',
          }}
          tabIndex={-1}
          aria-label="Volver atrás"
        >
          <RiArrowLeftLine
            size={24}
            style={{ color: 'var(--color-primary)' }}
          />
        </button>

        <div className="flex flex-col min-h-full px-6 py-8">
          {/* Formulario - contenido central */}
          <div className="flex-1 flex items-center justify-center">
            <form onSubmit={handleLogin} className="w-full max-w-md">
              {/* Título y descripción */}
              <div className="text-center mb-8">
                <h1
                  className="font-bold mb-2"
                  style={{ color: 'var(--color-primary)', fontSize: '24px' }}
                >
                  Iniciar sesión
                </h1>
                <p
                  style={{
                    color: 'var(--color-terciary)',
                    fontSize: '14px',
                  }}
                >
                  Ingresa las credenciales de tu cuenta
                </p>
              </div>
              {/* Campo de correo */}
              <div className="mb-4">
                <R2MInput
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onValueChange={setEmail}
                  required
                />
              </div>

              {/* Campo de contraseña */}
              <div className="mb-6">
                <R2MInput
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onValueChange={setPassword}
                  required
                />
              </div>

              {/* Botón de login */}
              <div className="mb-4">
                <R2MButton
                  type="submit"
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                >
                  Iniciar sesión
                </R2MButton>
              </div>

              {/* Link de olvidé contraseña */}
              <div className="text-center mb-6">
                <R2MTextLink
                  variant="secondary"
                  size="small"
                  onClick={() => router.push('/forgot-password', 'forward')}
                >
                  Olvidé mi contraseña
                </R2MTextLink>
              </div>

              {/* Divisor */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div
                    className="w-full border-t"
                    style={{ borderColor: 'var(--color-surface)' }}
                  ></div>
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="px-4"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-terciary)',
                      fontSize: '14px',
                    }}
                  >
                    o continúa con
                  </span>
                </div>
              </div>

              {/* Botones de inicio de sesión social */}
              <div className="flex gap-3 mb-6">
                {/* Botón de Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isMicrosoftLoading}
                  className="flex-1 p-4 border-2 transition-all duration-300 flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderRadius: '12px',
                    minHeight: '100px',
                    backgroundColor: '#EA4335',
                    borderColor: '#EA4335',
                  }}
                >
                  {isGoogleLoading ? (
                    <div
                      className="mb-2 border-4 border-white border-t-transparent rounded-full animate-spin"
                      style={{ width: '32px', height: '32px' }}
                    />
                  ) : (
                    <div
                      className="mb-2 flex items-center justify-center relative"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <RiGoogleFill size={32} style={{ color: 'white' }} />
                    </div>
                  )}
                  <h3
                    className="font-semibold text-center transition-colors duration-300"
                    style={{
                      fontSize: '14px',
                      color: 'white',
                    }}
                  >
                    {isGoogleLoading ? 'Cargando...' : 'Google'}
                  </h3>
                </button>

                {/* Botón de Microsoft */}
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={isGoogleLoading || isMicrosoftLoading}
                  className="flex-1 p-4 border-2 transition-all duration-300 flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderRadius: '12px',
                    minHeight: '100px',
                    backgroundColor: '#00A4EF',
                    borderColor: '#00A4EF',
                  }}
                >
                  {isMicrosoftLoading ? (
                    <div
                      className="mb-2 border-4 border-white border-t-transparent rounded-full animate-spin"
                      style={{ width: '32px', height: '32px' }}
                    />
                  ) : (
                    <div
                      className="mb-2 flex items-center justify-center relative"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <RiMicrosoftFill size={32} style={{ color: 'white' }} />
                    </div>
                  )}
                  <h3
                    className="font-semibold text-center transition-colors duration-300"
                    style={{
                      fontSize: '14px',
                      color: 'white',
                    }}
                  >
                    {isMicrosoftLoading ? 'Cargando...' : 'Microsoft'}
                  </h3>
                </button>
              </div>
            </form>
          </div>

          {/* Link de registro - fijo abajo */}
          <div className="flex-shrink-0 text-center pb-4">
            <span style={{ color: 'var(--color-terciary)', fontSize: '14px' }}>
              ¿No tienes cuenta?{' '}
            </span>
            <R2MTextLink
              variant="secondary"
              size="small"
              onClick={() => router.push('/register', 'forward')}
            >
              Regístrate
            </R2MTextLink>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
