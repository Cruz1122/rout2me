import { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import {
  RiGoogleLine,
  RiGoogleFill,
  RiMicrosoftLine,
  RiMicrosoftFill,
  RiArrowLeftLine,
} from 'react-icons/ri';
import R2MInput from '../../../shared/components/R2MInput';
import R2MButton from '../../../shared/components/R2MButton';
import R2MTextLink from '../../../shared/components/R2MTextLink';
import ErrorNotification from '../../../features/system/components/ErrorNotification';
import useErrorNotification from '../../system/hooks/useErrorNotification';
import { loginUser, validateAuthConfig } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const router = useIonRouter();
  const { login } = useAuth();
  const { error, handleError, clearError } = useErrorNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredProvider, setHoveredProvider] = useState<
    'google' | 'microsoft' | null
  >(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar configuración de autenticación
      validateAuthConfig();

      // Realizar el login con Supabase
      const loginData = {
        email: email.trim(),
        password: password,
      };

      console.log('Login attempt:', loginData);

      const response = await loginUser(loginData);

      console.log('Login exitoso:', response);

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

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // Implementar lógica de autenticación con Google
  };

  const handleMicrosoftLogin = () => {
    console.log('Microsoft login clicked');
    // Implementar lógica de autenticación con Microsoft
  };

  // Manejar el foco cuando la vista entra completamente
  useIonViewDidEnter(() => {
    // Habilitar el botón de retroceso para navegación por teclado
    if (backButtonRef.current) {
      backButtonRef.current.tabIndex = 0;
    }
  });

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
      <IonContent fullscreen className="ion-padding">
        {/* Notificación de error */}
        <ErrorNotification error={error} onClose={clearError} />
        {/* Botón de retroceso */}
        <button
          ref={backButtonRef}
          onClick={() => router.push('/welcome', 'back')}
          className="absolute top-4 left-4 z-5 p-2 rounded-full transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                  onClick={() => console.log('Forgot password clicked')}
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
                  onMouseEnter={() => setHoveredProvider('google')}
                  onMouseLeave={() => setHoveredProvider(null)}
                  className="flex-1 p-4 border-2 transition-all duration-300 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                  style={{
                    borderRadius: '12px',
                    minHeight: '100px',
                    backgroundColor:
                      hoveredProvider === 'google' ? '#EA4335' : 'white',
                    borderColor:
                      hoveredProvider === 'google' ? '#EA4335' : '#e5e7eb',
                  }}
                >
                  <div
                    className="mb-2 flex items-center justify-center relative"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <RiGoogleLine
                      size={32}
                      className={`absolute top-0 left-0 transition-all duration-300 ${
                        hoveredProvider === 'google'
                          ? 'opacity-0 scale-75'
                          : 'opacity-100 scale-100'
                      }`}
                      style={{ color: 'var(--color-terciary)' }}
                    />
                    <RiGoogleFill
                      size={32}
                      className={`absolute top-0 left-0 transition-all duration-300 ${
                        hoveredProvider === 'google'
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-75'
                      }`}
                      style={{ color: 'white' }}
                    />
                  </div>
                  <h3
                    className="font-semibold text-center transition-colors duration-300"
                    style={{
                      fontSize: '14px',
                      color: hoveredProvider === 'google' ? 'white' : '#1f2937',
                    }}
                  >
                    Google
                  </h3>
                </button>

                {/* Botón de Microsoft */}
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  onMouseEnter={() => setHoveredProvider('microsoft')}
                  onMouseLeave={() => setHoveredProvider(null)}
                  className="flex-1 p-4 border-2 transition-all duration-300 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                  style={{
                    borderRadius: '12px',
                    minHeight: '100px',
                    backgroundColor:
                      hoveredProvider === 'microsoft' ? '#00A4EF' : 'white',
                    borderColor:
                      hoveredProvider === 'microsoft' ? '#00A4EF' : '#e5e7eb',
                  }}
                >
                  <div
                    className="mb-2 flex items-center justify-center relative"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <RiMicrosoftLine
                      size={32}
                      className={`absolute top-0 left-0 transition-all duration-300 ${
                        hoveredProvider === 'microsoft'
                          ? 'opacity-0 scale-75'
                          : 'opacity-100 scale-100'
                      }`}
                      style={{ color: 'var(--color-terciary)' }}
                    />
                    <RiMicrosoftFill
                      size={32}
                      className={`absolute top-0 left-0 transition-all duration-300 ${
                        hoveredProvider === 'microsoft'
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-75'
                      }`}
                      style={{ color: 'white' }}
                    />
                  </div>
                  <h3
                    className="font-semibold text-center transition-colors duration-300"
                    style={{
                      fontSize: '14px',
                      color:
                        hoveredProvider === 'microsoft' ? 'white' : '#1f2937',
                    }}
                  >
                    Microsoft
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
