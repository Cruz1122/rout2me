import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { recoverPassword } from '../api/auth_api';
import { colorClasses } from '../styles/colors';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';
import AuthHeader from '../components/AuthHeader';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);
  const toastEntryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
      if (toastEntryTimerRef.current) clearTimeout(toastEntryTimerRef.current);
    };
  }, []);

  function showToast(type: 'success' | 'error', message: string) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (toastHideTimerRef.current) {
      clearTimeout(toastHideTimerRef.current);
      toastHideTimerRef.current = null;
    }
    if (toastEntryTimerRef.current) {
      clearTimeout(toastEntryTimerRef.current);
      toastEntryTimerRef.current = null;
    }

    setToast({ type, message, visible: false });
    toastEntryTimerRef.current = window.setTimeout(() => {
      setToast((t) => (t ? { ...t, visible: true } : t));
      toastTimerRef.current = window.setTimeout(() => {
        setToast((t) => (t ? { ...t, visible: false } : t));
        toastHideTimerRef.current = window.setTimeout(
          () => setToast(null),
          400,
        );
      }, 6000);
    }, 20);
  }

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    } else if (!emailRegex.test(email)) {
      setError('El correo electrónico no es válido');
      return false;
    }
    setError('');
    return true;
  };

  useEffect(() => {
    const isValid = validateEmail();
    setIsFormValid(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleBlur = () => {
    setTouched(true);
    validateEmail();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      await recoverPassword(email);
      setEmailSent(true);
      showToast(
        'success',
        'Correo enviado. Revisa tu bandeja de entrada para restablecer tu contraseña.',
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al enviar el correo. Por favor intenta nuevamente.';
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <style>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: inherit !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}</style>
        <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <AuthHeader />
            <div className="flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col w-full max-w-md py-5 px-4">
                <div className="flex flex-col items-center justify-center gap-6 text-center">
                  {/* Success Icon */}
                  <div className="flex items-center justify-center rounded-full bg-green-50 w-20 h-20">
                    <i className="ri-mail-check-line text-5xl text-green-600"></i>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h1
                      className={`${colorClasses.textPrimary} text-3xl font-black leading-tight tracking-[-0.033em]`}
                    >
                      ¡Correo enviado!
                    </h1>
                    <p className={`${colorClasses.textSecondary} text-base`}>
                      Hemos enviado un enlace de recuperación a{' '}
                      <span className="font-semibold">{email}</span>
                    </p>
                  </div>

                  <div
                    className={`${colorClasses.bgTerciary} rounded-xl p-4 w-full`}
                  >
                    <p className={`${colorClasses.textSecondary} text-sm`}>
                      Revisa tu bandeja de entrada y haz clic en el enlace para
                      restablecer tu contraseña. Si no lo ves, revisa tu carpeta
                      de spam.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 w-full pt-4">
                    <R2MButton
                      variant="secondary"
                      size="md"
                      fullWidth
                      onClick={() => navigate('/signin')}
                    >
                      Volver a iniciar sesión
                    </R2MButton>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                        setTouched(false);
                      }}
                      className={`${colorClasses.textSecondary} text-sm font-medium hover:${colorClasses.textPrimary} transition-colors`}
                    >
                      Enviar de nuevo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div
              className={`fixed top-6 right-6 z-60 transform transition-all duration-300 ease-out ${
                toast.visible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-3 scale-95'
              }`}
              style={{ willChange: 'opacity, transform' }}
            >
              <div
                className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${
                  toast.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <i
                  className={`${
                    toast.type === 'success'
                      ? 'ri-checkbox-circle-fill text-green-600'
                      : 'ri-error-warning-fill text-red-600'
                  } text-2xl flex-shrink-0`}
                ></i>
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: inherit !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <AuthHeader />
          <div className="flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-md py-5 px-4">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-center">
                  <h1
                    className={`${colorClasses.textPrimary} text-3xl font-black leading-tight tracking-[-0.033em]`}
                  >
                    Recuperar contraseña
                  </h1>
                  <p className={`${colorClasses.textSecondary} text-base`}>
                    Ingresa tu correo electrónico y te enviaremos un enlace para
                    restablecer tu contraseña
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col">
                      <p
                        className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                      >
                        Correo electrónico
                      </p>
                      <R2MInput
                        type="email"
                        placeholder="Ingresa tu correo electrónico"
                        value={email}
                        onValueChange={(value) => setEmail(value)}
                        onBlur={handleBlur}
                        error={touched ? error : undefined}
                        icon="ri-mail-line"
                      />
                    </div>

                    <div className="pt-3">
                      <R2MButton
                        type="submit"
                        disabled={!isFormValid || isLoading}
                        loading={isLoading}
                        variant="secondary"
                        size="md"
                        fullWidth
                      >
                        Enviar enlace de recuperación
                      </R2MButton>
                    </div>
                  </div>
                </form>

                <div className="flex justify-center gap-2 pt-2">
                  <p className={`${colorClasses.textSecondary} text-sm`}>
                    ¿Recordaste tu contraseña?
                  </p>
                  <button
                    onClick={() => navigate('/signin')}
                    className="text-sm font-bold text-[#1E56A0] hover:text-[#163172]"
                  >
                    Iniciar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-60 transform transition-all duration-300 ease-out ${
              toast.visible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-3 scale-95'
            }`}
            style={{ willChange: 'opacity, transform' }}
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <i
                className={`${
                  toast.type === 'success'
                    ? 'ri-checkbox-circle-fill text-green-600'
                    : 'ri-error-warning-fill text-red-600'
                } text-2xl flex-shrink-0`}
              ></i>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
