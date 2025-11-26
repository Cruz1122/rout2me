import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import R2MButton from '../../../shared/components/R2MButton';
import { useTheme } from '../../../contexts/ThemeContext';

export default function WelcomePage() {
  const router = useIonRouter();
  const { theme } = useTheme();

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
            <div className="w-64 h-80 mx-auto mb-8 flex items-center justify-center">
              <img
                src="/icon-metadata.webp"
                alt="Rout2Me"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter:
                    theme === 'light'
                      ? 'brightness(0) saturate(100%) invert(8%) sepia(96%) saturate(2000%) hue-rotate(210deg) brightness(0.88) contrast(1.1)'
                      : 'none',
                }}
              />
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
