import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiArrowLeftLine, RiMailLine } from 'react-icons/ri';
import { recoverPassword } from '../services/authService';
import R2MInput from '../../../shared/components/R2MInput';
import R2MButton from '../../../shared/components/R2MButton';
import ErrorNotification from '../../system/components/ErrorNotification';
import useErrorNotification from '../../system/hooks/useErrorNotification';

export default function ForgotPasswordPage() {
  const router = useIonRouter();
  const { error, handleError, clearError } = useErrorNotification();
  const contentRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Efecto para el cooldown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!email.trim()) {
      handleError(new Error('Por favor ingresa tu correo electrónico'));
      return;
    }

    if (cooldownSeconds > 0) {
      handleError(
        new Error(
          `Debes esperar ${cooldownSeconds} segundos antes de solicitar otro enlace`,
        ),
      );
      return;
    }

    setIsLoading(true);

    try {
      await recoverPassword(email.trim());
      setSuccessMessage(
        'Se ha enviado un enlace de recuperación a tu correo electrónico',
      );
      // Iniciar cooldown de 60 segundos
      setCooldownSeconds(60);
      // Limpiar el campo de email
      setEmail('');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/login', 'back');
  };

  useIonViewDidEnter(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
    if (backButtonRef.current) {
      backButtonRef.current.tabIndex = 0;
    }
  });

  useEffect(() => {
    if (backButtonRef.current) {
      backButtonRef.current.tabIndex = -1;
    }
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <ErrorNotification error={error} onClose={clearError} />

        {/* Botón de retroceso */}
        <button
          ref={backButtonRef}
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-50 p-2 transition-colors"
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

        <div
          ref={contentRef}
          className="flex flex-col min-h-full px-6"
          tabIndex={-1}
        >
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
                  <RiMailLine
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
                  Recuperar contraseña
                </p>
                <p
                  style={{
                    color: 'var(--color-terciary)',
                    fontSize: '14px',
                  }}
                >
                  Ingresa tu correo electrónico y te enviaremos un enlace para
                  restablecer tu contraseña
                </p>
              </div>

              {/* Mensaje de éxito */}
              {successMessage && (
                <div
                  className="mb-6 p-4 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <p
                    className="text-sm text-center"
                    style={{ color: '#16a34a', margin: 0 }}
                  >
                    {successMessage}
                  </p>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <R2MInput
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onValueChange={setEmail}
                    required
                  />
                </div>

                <div className="flex justify-center">
                  <div className="w-full">
                    <R2MButton
                      type="submit"
                      variant="primary"
                      size="large"
                      disabled={isLoading || cooldownSeconds > 0}
                      loading={isLoading}
                      fullWidth
                    >
                      {cooldownSeconds > 0
                        ? `Espera ${cooldownSeconds}s`
                        : 'Enviar enlace'}
                    </R2MButton>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
