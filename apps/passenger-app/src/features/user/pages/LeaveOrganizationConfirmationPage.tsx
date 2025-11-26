import { useEffect, useRef, useState } from 'react';
import { Redirect } from 'react-router';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiArrowLeftLine, RiUserUnfollowLine } from 'react-icons/ri';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getUserInfo,
  getPrimaryOrganization,
  leaveOrganization,
  type UserResponse,
} from '../services/userService';
import R2MLoader from '../../../shared/components/R2MLoader';

export default function LeaveOrganizationConfirmationPage() {
  const router = useIonRouter();
  const { accessToken } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const [userInfo, setUserInfo] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectToProfile, setRedirectToProfile] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchUserInfo = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getUserInfo(accessToken);
        setUserInfo(data);
      } catch (err) {
        // Esperar 1 segundo antes de mostrar el error
        timeoutId = setTimeout(() => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Error al cargar información del usuario';
          setError(errorMessage);
          console.error('Error fetching user info:', err);
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [accessToken]);

  const handleConfirmLeave = async () => {
    if (!userInfo || !accessToken) {
      setTimeout(() => {
        setError('No hay información de usuario o sesión activa');
      }, 1000);
      return;
    }

    const organization = getPrimaryOrganization(userInfo);
    if (!organization) {
      setTimeout(() => {
        setError('No se encontró la organización actual');
      }, 1000);
      return;
    }

    try {
      setIsLeaving(true);
      setError(null);
      const result = await leaveOrganization(accessToken, organization.org_key);

      const success =
        result?.ok ||
        result?.message === 'left' ||
        result?.message === 'no_active_membership' ||
        result?.already_left === true;

      if (success) {
        // Intento principal con IonRouter
        router.push('/perfil', 'forward', 'replace');
        // Activar fallback de Redirect en el siguiente render
        setRedirectToProfile(true);
        // Fallback adicional por si la pila no cambia (tabs vs outlet)
        setTimeout(() => {
          if (globalThis.location.pathname !== '/perfil') {
            globalThis.history.replaceState({}, '', '/perfil');
          }
        }, 120);
        return;
      }
      setTimeout(() => {
        setError(
          'No se confirmó la salida de la organización. Intenta nuevamente.',
        );
      }, 1000);
    } catch (err) {
      setTimeout(() => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Error al abandonar la organización';
        setError(errorMessage);
        console.error('Error leaving organization:', err);
      }, 1000);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleGoBack = () => {
    router.push('/perfil', 'back');
  };

  // Manejar el foco cuando la vista entra completamente
  useIonViewDidEnter(() => {
    // Mover el foco al contenido principal para evitar problemas de accesibilidad
    if (contentRef.current) {
      contentRef.current.focus();
    }
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
  }, []);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <div className="flex items-center justify-center h-full">
            <R2MLoader />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Fallback de redirección declarativa si el push no afectó el stack
  if (redirectToProfile) {
    return <Redirect to="/perfil" />;
  }

  if (error && !userInfo) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p
              className="text-lg font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              {error}
            </p>
            <button
              onClick={handleGoBack}
              className="mt-4 px-6 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
              }}
            >
              Volver
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const organization = userInfo ? getPrimaryOrganization(userInfo) : null;
  const organizationName = organization?.company_name || 'la organización';

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="ion-padding"
        style={{ '--background': 'var(--color-bg)' }}
      >
        {/* Botón de retroceso */}
        <button
          ref={backButtonRef}
          onClick={handleGoBack}
          disabled={isLeaving}
          className="absolute top-4 left-4 z-50 p-2 rounded-full transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'rgba(var(--color-card-rgb), 0.9)',
          }}
          tabIndex={-1}
          aria-label="Volver atrás"
        >
          <RiArrowLeftLine size={24} style={{ color: 'var(--color-error)' }} />
        </button>

        <div
          ref={contentRef}
          className="flex flex-col min-h-full px-6"
          tabIndex={-1}
        >
          {/* Espaciado superior */}
          <div className="flex-shrink-0 pt-8"></div>

          {/* Contenido centrado */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md text-center">
              {/* Ícono */}
              <div className="mb-6 flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(var(--color-error-rgb), 0.1)',
                  }}
                >
                  <RiUserUnfollowLine
                    size={40}
                    style={{ color: 'var(--color-error)' }}
                  />
                </div>
              </div>

              {/* Título */}
              <p
                className="font-bold mb-3"
                style={{ color: 'var(--color-error)', fontSize: '24px' }}
              >
                Abandonar organización
              </p>

              {/* Mensaje */}
              <p
                className="mb-8"
                style={{
                  color: 'var(--color-terciary)',
                  fontSize: '16px',
                  lineHeight: '1.5',
                }}
              >
                ¿Estás seguro de que deseas abandonar la organización "
                {organizationName}"? Esta acción no se puede deshacer.
              </p>

              {/* Mensaje de error */}
              {error && (
                <div
                  className="mb-4 p-3 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(var(--color-error-rgb), 0.1)',
                    color: 'var(--color-error)',
                  }}
                >
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Botón de acción fijo */}
          <div className="flex-shrink-0 py-6">
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <button
                  type="button"
                  onClick={handleConfirmLeave}
                  disabled={isLeaving || !organization}
                  className="w-full h-14 !rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isLeaving
                      ? 'rgba(var(--color-error-rgb), 0.9)'
                      : 'var(--color-error)',
                    color: 'var(--color-on-primary)',
                    boxShadow: isLeaving
                      ? '0 5px 15px -5px rgba(var(--color-error-rgb), 0.2)'
                      : '0 10px 25px -5px rgba(var(--color-error-rgb), 0.3)',
                    cursor: isLeaving ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLeaving && !e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#B91C1C';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow =
                        '0 15px 30px -5px rgba(220, 38, 38, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLeaving && !e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#DC2626';
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow =
                        '0 10px 25px -5px rgba(220, 38, 38, 0.3)';
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!isLeaving && !e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }
                  }}
                >
                  {isLeaving ? (
                    <span>Abandonando...</span>
                  ) : (
                    <>
                      <RiUserUnfollowLine size={20} />
                      <span>Abandonar organización</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
