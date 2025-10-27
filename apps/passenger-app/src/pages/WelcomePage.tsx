import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import R2MButton from '../components/R2MButton';

export default function WelcomePage() {
  const router = useIonRouter();

  const handleLogin = () => {
    router.push('/login', 'forward');
  };

  const handleRegister = () => {
    router.push('/register', 'forward');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="flex flex-col items-center justify-center min-h-full px-6">
          {/* Logo y Título */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-64 h-80 mx-auto mb-8 flex items-center justify-center relative">
              {/* Imagen con forma ovalada y bordes desvanecidos */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow:
                    '0 0 40px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                }}
              >
                <img
                  src="/onboarding.png"
                  alt="Rout2Me"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {/* Overlay para bordes desvanecidos */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '50%',
                    boxShadow:
                      'inset 0 0 100px rgba(0, 0, 0, 0.05), inset 0 0 200px rgba(255, 255, 255, 0.5)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
            <h1
              className="font-bold mb-2"
              style={{
                color: 'var(--color-primary)',
                fontSize: '28px',
                fontWeight: 'bold',
              }}
            >
              ¡Bienvenido a Rout2Me!
            </h1>
            <p
              style={{
                color: 'var(--color-terciary)',
                fontSize: '16px',
                lineHeight: '1.5',
                maxWidth: '300px',
                textAlign: 'center',
              }}
            >
              Tu sistema de transporte público
            </p>
          </div>

          {/* Botones fijos abajo */}
          <div className="flex-shrink-0 w-full max-w-md pb-8">
            <div className="space-y-4">
              <R2MButton
                variant="primary"
                size="large"
                fullWidth
                onClick={handleLogin}
              >
                Iniciar sesión
              </R2MButton>
              <R2MButton
                variant="outline"
                size="large"
                fullWidth
                onClick={handleRegister}
              >
                Crear cuenta
              </R2MButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
