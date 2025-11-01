import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import { RiTimeLine } from 'react-icons/ri';
import R2MButton from '../../../shared/components/R2MButton';

export default function ExpiredLinkPage() {
  const router = useIonRouter();

  const handleGoToForgotPassword = () => {
    router.push('/forgot-password', 'forward');
  };

  const handleGoToLogin = () => {
    router.push('/login', 'back');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="flex flex-col min-h-full px-6">
          {/* Espaciador superior */}
          <div className="flex-shrink-0 pt-8"></div>

          {/* Contenido principal centrado */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              {/* Ícono */}
              <div className="mb-6 flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(22, 49, 114, 0.1)' }}
                >
                  <RiTimeLine
                    size={40}
                    style={{ color: 'var(--color-primary)' }}
                  />
                </div>
              </div>

              {/* Título y descripción */}
              <div className="mb-8 text-center">
                <p
                  className="font-bold mb-2"
                  style={{ color: 'var(--color-primary)', fontSize: '24px' }}
                >
                  Enlace expirado
                </p>
                <p
                  style={{
                    color: 'var(--color-terciary)',
                    fontSize: '14px',
                  }}
                >
                  El enlace de recuperación ha expirado o ya fue utilizado.
                  Solicita uno nuevo para restablecer tu contraseña.
                </p>
              </div>

              {/* Botones */}
              <div className="space-y-3">
                <R2MButton
                  variant="primary"
                  size="large"
                  fullWidth
                  onClick={handleGoToForgotPassword}
                >
                  Solicitar nuevo enlace
                </R2MButton>

                <R2MButton
                  variant="secondary"
                  size="large"
                  fullWidth
                  onClick={handleGoToLogin}
                >
                  Volver al inicio de sesión
                </R2MButton>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
