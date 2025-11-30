import { useEffect, useRef, useState } from 'react';
import { Redirect } from 'react-router';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiArrowLeftLine, RiKey2Line, RiUserAddLine } from 'react-icons/ri';
import { useAuth } from '../../auth/hooks/useAuth';
import { joinOrganization } from '../services/userService';
import R2MCodeInput from '../../../shared/components/R2MCodeInput';
import R2MLoader from '../../../shared/components/R2MLoader';

export default function JoinOrganizationPage() {
  const router = useIonRouter();
  const { accessToken, isLoading: isAuthLoading } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  // Usar new Array para satisfacer regla de lint
  const [orgKey, setOrgKey] = useState<string[]>(new Array(6).fill(''));
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectToProfile, setRedirectToProfile] = useState(false);

  const handleKeyChange = (newKey: string[]) => {
    setOrgKey(newKey);
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError(null);
    }
  };

  // Debug: verificar estado del botón
  useEffect(() => {
    const keyLength = orgKey.join('').length;
    const isButtonEnabled =
      !isJoining && keyLength === 6 && !isAuthLoading && !!accessToken;
    console.log('[JoinOrganizationPage] Estado del botón:', {
      isJoining,
      keyLength,
      isAuthLoading,
      hasAccessToken: !!accessToken,
      isButtonEnabled,
    });
  }, [orgKey, isJoining, isAuthLoading, accessToken]);

  const handleJoinOrganization = async (key: string) => {
    // Prevenir ejecución si no hay accessToken (aún cargando)
    if (!accessToken) {
      return;
    }

    if (key?.length !== 6) {
      setTimeout(() => {
        setError('La clave debe tener 6 caracteres');
      }, 1000);
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      const result = await joinOrganization(accessToken, key);

      const success =
        result?.ok === true ||
        result?.status === 'rejoined' ||
        result?.status === 'joined' ||
        !!result?.membership_id;

      if (success) {
        router.push('/perfil', 'forward', 'replace');
        setRedirectToProfile(true);
        setTimeout(() => {
          if (globalThis.location.pathname !== '/perfil') {
            globalThis.history.replaceState({}, '', '/perfil');
          }
        }, 120);
        return;
      }

      setTimeout(() => {
        setError('La respuesta no confirmó la unión. Intenta nuevamente.');
      }, 1000);
    } catch (err) {
      setTimeout(() => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Error al unirse a la organización';
        setError(errorMessage);
        console.error('Error joining organization:', err);
        setIsJoining(false);
      }, 1000);
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

  if (redirectToProfile) {
    return <Redirect to="/perfil" />;
  }

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        {/* Loader de pantalla completa cuando está uniéndose */}
        {isJoining && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-background)' }}
          >
            <R2MLoader />
          </div>
        )}

        {/* Botón de retroceso */}
        {!isJoining && (
          <button
            ref={backButtonRef}
            onClick={handleGoBack}
            disabled={isJoining}
            className="absolute top-4 left-4 z-50 p-2 transition-colors disabled:opacity-50"
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
        )}

        {!isJoining && (
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
                    style={{ backgroundColor: 'rgba(22, 49, 114, 0.1)' }}
                  >
                    <RiKey2Line
                      size={40}
                      style={{ color: 'var(--color-primary)' }}
                    />
                  </div>
                </div>

                {/* Título */}
                <p
                  className="font-bold mb-3"
                  style={{ color: 'var(--color-primary)', fontSize: '24px' }}
                >
                  Unirse a una organización
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
                  Ingresa la clave única proporcionada por tu organización
                </p>

                {/* Campo de clave única */}
                <div className="mb-6">
                  <R2MCodeInput
                    length={6}
                    value={orgKey}
                    onChange={handleKeyChange}
                    type="alphanumeric"
                    autoFocus
                  />
                  <p
                    className="text-center text-sm mt-4"
                    style={{ color: 'var(--color-terciary)' }}
                  >
                    Puedes copiar y pegar la clave completa
                  </p>
                </div>

                {/* Mensaje de error */}
                {error && (
                  <div
                    className="mb-4 p-3 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                    }}
                  >
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de acción fijo (opcional, por si se quiere un botón manual) */}
            <div className="flex-shrink-0 py-6">
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  {(() => {
                    const keyLength = orgKey.join('').length;
                    const isButtonEnabled =
                      !isJoining &&
                      keyLength === 6 &&
                      !isAuthLoading &&
                      !!accessToken;

                    return (
                      <button
                        type="button"
                        onClick={() => handleJoinOrganization(orgKey.join(''))}
                        disabled={!isButtonEnabled}
                        className="w-full h-14 !rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: isButtonEnabled
                            ? 'var(--color-primary)'
                            : 'var(--color-surface)',
                          color: '#FFFFFF',
                          boxShadow: isButtonEnabled
                            ? '0 10px 25px -5px rgba(22, 49, 114, 0.3)'
                            : 'none',
                          cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
                        }}
                        onMouseEnter={(e) => {
                          if (isButtonEnabled && !e.currentTarget.disabled) {
                            e.currentTarget.style.transform =
                              'translateY(-2px)';
                            e.currentTarget.style.boxShadow =
                              '0 15px 30px -5px rgba(22, 49, 114, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isButtonEnabled && !e.currentTarget.disabled) {
                            e.currentTarget.style.transform = 'translateY(0px)';
                            e.currentTarget.style.boxShadow =
                              '0 10px 25px -5px rgba(22, 49, 114, 0.3)';
                          }
                        }}
                        onMouseDown={(e) => {
                          if (isButtonEnabled && !e.currentTarget.disabled) {
                            e.currentTarget.style.transform = 'translateY(0px)';
                          }
                        }}
                      >
                        <RiUserAddLine size={20} />
                        <span>Unirse</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
