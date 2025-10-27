import { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { RiLock2Line } from 'react-icons/ri';
import R2MButton from '../components/R2MButton';
import R2MTextLink from '../components/R2MTextLink';
import R2MCodeInput from '../components/R2MCodeInput';
import ErrorNotification, {
  useErrorNotification,
} from '../components/ErrorNotification';

export default function TwoFAPage() {
  const history = useHistory();
  const { error, showError, clearError } = useErrorNotification();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Efecto para el cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Función para verificar el código
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      showError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setIsLoading(true);
    console.log('Verifying 2FA code:', fullCode);

    // Simular verificación
    setTimeout(() => {
      setIsLoading(false);
      // Simular éxito/error
      if (fullCode === '123456') {
        // Código correcto - redirigir sin mensaje
        history.push('/inicio');
      } else {
        showError('Código incorrecto. Intenta nuevamente.');
        setCode(['', '', '', '', '', '']);
      }
    }, 2000);
  };

  // Función para reenviar código
  const handleResendCode = () => {
    if (!canResend) return;

    setCanResend(false);
    setCooldown(60);
    console.log('Resending 2FA code...');
    showError('Código reenviado. Revisa tu correo electrónico.');
  };

  // Función para formatear el tiempo del cooldown
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        {/* Notificación de error */}
        <ErrorNotification error={error} onClose={clearError} />
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <RiLock2Line
                size={48}
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
            <h1
              className="font-bold"
              style={{ color: 'var(--color-primary)', fontSize: '24px' }}
            >
              Verificación en dos pasos
            </h1>
            <p
              style={{
                color: 'var(--color-terciary)',
                fontSize: '14px',
                marginTop: '8px',
              }}
            >
              Ingresa el código de 6 dígitos que enviamos a tu correo
            </p>
          </div>

          {/* Formulario de código */}
          <form onSubmit={handleVerifyCode} className="w-full max-w-md">
            {/* Inputs del código */}
            <div className="mb-8">
              <R2MCodeInput
                length={6}
                value={code}
                onChange={setCode}
                type="numeric"
                autoFocus
              />
              <p
                className="text-center text-sm mt-4"
                style={{ color: 'var(--color-terciary)' }}
              >
                Puedes copiar y pegar el código completo
              </p>
            </div>

            {/* Botón de verificar */}
            <div className="mb-6">
              <R2MButton
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isLoading}
                disabled={code.join('').length !== 6}
              >
                Verificar código
              </R2MButton>
            </div>

            {/* Botón de reenviar */}
            <div className="text-center mb-6">
              {canResend ? (
                <R2MTextLink
                  variant="secondary"
                  size="small"
                  onClick={handleResendCode}
                >
                  Reenviar código
                </R2MTextLink>
              ) : (
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-terciary)' }}
                >
                  Reenviar código en {formatCooldown(cooldown)}
                </p>
              )}
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
                  o
                </span>
              </div>
            </div>

            {/* Link de volver al login */}
            <div className="text-center">
              <span
                style={{ color: 'var(--color-terciary)', fontSize: '14px' }}
              >
                ¿Problemas con el código?{' '}
              </span>
              <R2MTextLink
                variant="secondary"
                size="small"
                onClick={() => history.push('/login')}
              >
                Iniciar sesión con otra cuenta
              </R2MTextLink>
            </div>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
}
