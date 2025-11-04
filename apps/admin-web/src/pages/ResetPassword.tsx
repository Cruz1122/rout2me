import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/auth_api';
import { colorClasses } from '../styles/colors';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';
import AuthHeader from '../components/AuthHeader';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [touched, setTouched] = useState<{
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);
  const toastEntryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Obtener el access token del hash de la URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (!token || type !== 'recovery') {
      showToast('error', 'Enlace inválido o expirado');
      setTimeout(() => navigate('/signin'), 3000);
      return;
    }

    setAccessToken(token);

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
      if (toastEntryTimerRef.current) clearTimeout(toastEntryTimerRef.current);
    };
  }, [navigate]);

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

  const validateForm = () => {
    const newErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    // Validación de contraseña
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])/.test(
        formData.password,
      )
    ) {
      newErrors.password =
        'Debe contener mayúsculas, minúsculas, números y un carácter especial (@$!%*?&.#_-)';
    }

    // Validación de confirmación de contraseña
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const isValid = validateForm();
    setIsFormValid(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      password: true,
      confirmPassword: true,
    });

    if (!validateForm() || !accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(accessToken, formData.password);
      setResetSuccess(true);
      showToast('success', 'Contraseña restablecida exitosamente');
      setTimeout(() => navigate('/signin'), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al restablecer la contraseña. Por favor intenta nuevamente.';
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
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
                    <i className="ri-check-line text-5xl text-green-600"></i>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h1
                      className={`${colorClasses.textPrimary} text-3xl font-black leading-tight tracking-[-0.033em]`}
                    >
                      ¡Contraseña restablecida!
                    </h1>
                    <p className={`${colorClasses.textSecondary} text-base`}>
                      Tu contraseña ha sido actualizada exitosamente
                    </p>
                  </div>

                  <div
                    className={`${colorClasses.bgTerciary} rounded-xl p-4 w-full`}
                  >
                    <p className={`${colorClasses.textSecondary} text-sm`}>
                      Serás redirigido a la página de inicio de sesión en unos
                      segundos...
                    </p>
                  </div>

                  <div className="w-full pt-4">
                    <R2MButton
                      variant="secondary"
                      size="md"
                      fullWidth
                      onClick={() => navigate('/signin')}
                    >
                      Ir a iniciar sesión
                    </R2MButton>
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
                    Restablecer contraseña
                  </h1>
                  <p className={`${colorClasses.textSecondary} text-base`}>
                    Ingresa tu nueva contraseña
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col">
                      <p
                        className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                      >
                        Nueva contraseña
                      </p>
                      <R2MInput
                        type="password"
                        placeholder="Ingresa tu nueva contraseña"
                        value={formData.password}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, password: value }))
                        }
                        onBlur={() => handleBlur('password')}
                        error={touched.password ? errors.password : undefined}
                        icon="ri-lock-password-line"
                      />
                    </div>

                    <div className="flex flex-col">
                      <p
                        className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                      >
                        Confirmar contraseña
                      </p>
                      <R2MInput
                        type="password"
                        placeholder="Confirma tu nueva contraseña"
                        value={formData.confirmPassword}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            confirmPassword: value,
                          }))
                        }
                        onBlur={() => handleBlur('confirmPassword')}
                        error={
                          touched.confirmPassword
                            ? errors.confirmPassword
                            : undefined
                        }
                        icon="ri-lock-password-line"
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
                        Restablecer contraseña
                      </R2MButton>
                    </div>
                  </div>
                </form>
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
