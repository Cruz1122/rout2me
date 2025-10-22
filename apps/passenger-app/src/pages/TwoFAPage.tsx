import { useState, useRef, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import R2MButton from '../components/R2MButton';
import R2MTextLink from '../components/R2MTextLink';

export default function TwoFAPage() {
  const history = useHistory();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Función para manejar el cambio de código
  const handleCodeChange = (index: number, value: string) => {
    // Solo permitir números
    const numericValue = value.replaceAll(/\D/g, '');

    if (numericValue.length > 1) {
      // Si se pega un código completo, distribuirlo
      const pastedCode = numericValue.slice(0, 6).split('');
      const newCode = [...code];
      for (const [i, digit] of pastedCode.entries()) {
        if (i < 6) {
          newCode[i] = digit;
        }
      }
      setCode(newCode);

      // Enfocar el último input lleno o el siguiente vacío
      const lastFilledIndex = newCode.findIndex((digit, i) => !digit && i > 0);
      const nextIndex =
        lastFilledIndex === -1
          ? Math.min(5, pastedCode.length - 1)
          : lastFilledIndex;
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
      }
    } else {
      // Cambio normal de un dígito
      const newCode = [...code];
      newCode[index] = numericValue;
      setCode(newCode);

      // Auto-avanzar al siguiente input si se ingresó un dígito
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Función para manejar teclas especiales
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Si el input actual está vacío y se presiona backspace, ir al anterior
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Función para verificar el código
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      alert('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setIsLoading(true);
    console.log('Verifying 2FA code:', fullCode);

    // Simular verificación
    setTimeout(() => {
      setIsLoading(false);
      // Simular éxito/error
      if (fullCode === '123456') {
        alert('Código verificado correctamente');
        history.push('/inicio');
      } else {
        alert('Código incorrecto. Intenta nuevamente.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 2000);
  };

  // Función para reenviar código
  const handleResendCode = () => {
    if (!canResend) return;

    setCanResend(false);
    setCooldown(60);
    console.log('Resending 2FA code...');
    alert('Código reenviado. Revisa tu correo electrónico.');
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
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
          {/* Logo */}
          <div className="mb-12 text-center">
            <div
              className="w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: 'var(--color-primary)',
              }}
            >
              <span
                className="font-bold text-white"
                style={{ fontSize: '32px' }}
              >
                R2M
              </span>
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
              <div className="flex justify-center gap-3 mb-4">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    style={{
                      borderColor: digit
                        ? 'var(--color-primary)'
                        : 'var(--color-surface)',
                      backgroundColor: digit ? 'var(--color-bg)' : 'white',
                      color: 'var(--color-text)',
                    }}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {/* Mensaje de ayuda */}
              <p
                className="text-center text-sm"
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
