import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiCheckboxCircleFill, RiErrorWarningFill } from 'react-icons/ri';
import R2MButton from '../../../shared/components/R2MButton';

export default function ConfirmAccountPage() {
  const router = useIonRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Verificar el resultado de la confirmación
  useEffect(() => {
    const hash = globalThis.location.hash;
    const params = new URLSearchParams(hash.substring(1));

    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const type = params.get('type');

    // Si hay un error
    if (error) {
      setIsError(true);
      setErrorMessage(
        errorDescription ||
          'No se pudo verificar tu cuenta. El enlace puede haber expirado.',
      );
    }
    // Si es una confirmación exitosa
    else if (type === 'signup') {
      setIsSuccess(true);
    }
    // Si no hay parámetros relevantes, asumir éxito por defecto
    else {
      setIsSuccess(true);
    }
  }, []);

  const handleGoToLogin = () => {
    router.push('/login', 'root');
  };

  useIonViewDidEnter(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  });

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div
          ref={contentRef}
          className="flex flex-col min-h-full px-6"
          tabIndex={-1}
        >
          <div className="flex-shrink-0 pt-8"></div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              {/* Vista de éxito */}
              {isSuccess && (
                <>
                  <div className="mb-6 flex justify-center">
                    <div className="w-28 h-28 flex items-center justify-center">
                      <RiCheckboxCircleFill
                        size={112}
                        style={{ color: '#22c55e' }}
                      />
                    </div>
                  </div>

                  <div className="mb-8 text-center">
                    <h1
                      className="font-bold mb-3"
                      style={{
                        color: 'var(--color-primary)',
                        fontSize: '28px',
                      }}
                    >
                      ¡Cuenta verificada!
                    </h1>
                    <p
                      style={{
                        color: 'var(--color-terciary)',
                        fontSize: '16px',
                        lineHeight: '1.5',
                      }}
                    >
                      Tu cuenta ha sido verificada exitosamente. Ahora puedes
                      iniciar sesión y disfrutar de todas las funcionalidades de
                      Rout2Me.
                    </p>
                  </div>
                </>
              )}

              {/* Vista de error */}
              {isError && (
                <>
                  <div className="mb-6 flex justify-center">
                    <div className="w-28 h-28 flex items-center justify-center">
                      <RiErrorWarningFill
                        size={112}
                        style={{ color: '#ef4444' }}
                      />
                    </div>
                  </div>

                  <div className="mb-8 text-center">
                    <h1
                      className="font-bold mb-3"
                      style={{
                        color: 'var(--color-primary)',
                        fontSize: '28px',
                      }}
                    >
                      Error de verificación
                    </h1>
                    <p
                      style={{
                        color: 'var(--color-terciary)',
                        fontSize: '16px',
                        lineHeight: '1.5',
                      }}
                    >
                      {errorMessage}
                    </p>
                    <p
                      className="mt-4"
                      style={{
                        color: 'var(--color-terciary)',
                        fontSize: '14px',
                      }}
                    >
                      Por favor, solicita un nuevo enlace de verificación o
                      contacta con soporte.
                    </p>
                  </div>
                </>
              )}

              {/* Botón para ir al login */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <R2MButton
                    type="button"
                    variant="primary"
                    size="large"
                    onClick={handleGoToLogin}
                    fullWidth
                  >
                    {isSuccess ? 'Iniciar sesión' : 'Volver al inicio'}
                  </R2MButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
