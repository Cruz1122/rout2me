import { useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiArrowLeftLine, RiLogoutBoxRLine } from 'react-icons/ri';
import { useAuth } from '../../auth/hooks/useAuth';

export default function LogoutConfirmationPage() {
  const router = useIonRouter();
  const { logout } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirmLogout = () => {
    logout();
    router.push('/welcome', 'root', 'replace');
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

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        {/* Botón de retroceso */}
        <button
          ref={backButtonRef}
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-50 p-2 rounded-full transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
          tabIndex={-1}
          aria-label="Volver atrás"
        >
          <RiArrowLeftLine size={24} style={{ color: '#DC2626' }} />
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
                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
                >
                  <RiLogoutBoxRLine size={40} style={{ color: '#DC2626' }} />
                </div>
              </div>

              {/* Título */}
              <p
                className="font-bold mb-3"
                style={{ color: '#DC2626', fontSize: '24px' }}
              >
                Cerrar sesión
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
                ¿Estás seguro de que deseas cerrar sesión? Podrás iniciar sesión
                nuevamente en cualquier momento.
              </p>
            </div>
          </div>

          {/* Botón de acción fijo */}
          <div className="flex-shrink-0 py-6">
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="w-full h-14 !rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 border-none cursor-pointer"
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#B91C1C';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 15px 30px -5px rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#DC2626';
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow =
                      '0 10px 25px -5px rgba(220, 38, 38, 0.3)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                >
                  <RiLogoutBoxRLine size={20} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
