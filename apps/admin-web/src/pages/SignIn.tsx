import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signIn } from '../api/auth_api';
import { useAuth } from '../context/AuthContext';
import { colorClasses } from '../styles/colors';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';
import AuthHeader from '../components/AuthHeader';

export default function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);
  const toastEntryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Verificar si viene de la verificación de email
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      showToast('success', '¡Correo verificado! Ya puedes iniciar sesión.');
    }

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
      if (toastEntryTimerRef.current) clearTimeout(toastEntryTimerRef.current);
    };
  }, [location]);

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

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    // Validación de contraseña
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const isValid = validateForm();
    setIsFormValid(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos los campos como tocados
    setTouched({
      email: true,
      password: true,
    });

    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await signIn(formData.email, formData.password);

        // Extraer información del usuario
        const user = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.user_metadata.name || '',
          phone: response.user.user_metadata.phone || '',
        };

        // Guardar en el contexto y localStorage
        setAuth(response.access_token, response.refresh_token, user);

        // Mostrar mensaje de éxito
        showToast('success', '¡Bienvenido! Inicio de sesión exitoso');

        // Redirigir a home después de 2 segundos
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        showToast(
          'error',
          error instanceof Error
            ? error.message
            : 'Error al iniciar sesión. Verifica tus credenciales.',
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

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
      <div
        className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <AuthHeader showSignUp={true} />
          <div className="flex flex-1 justify-center py-10">
            <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5">
              <h2
                className={`${colorClasses.textPrimary} tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5`}
              >
                Inicia sesión en tu cuenta
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                  <div className="flex flex-col flex-1 min-w-0">
                    <p
                      className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                    >
                      Correo electrónico
                    </p>
                    <R2MInput
                      type="email"
                      placeholder="Ingresa tu correo electrónico"
                      value={formData.email}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, email: value }))
                      }
                      onBlur={() => handleBlur('email')}
                      error={touched.email ? errors.email : undefined}
                      icon="ri-mail-line"
                    />
                  </div>
                </div>
                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                  <div className="flex flex-col flex-1 min-w-0">
                    <p
                      className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                    >
                      Contraseña
                    </p>
                    <R2MInput
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      value={formData.password}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, password: value }))
                      }
                      onBlur={() => handleBlur('password')}
                      error={touched.password ? errors.password : undefined}
                      icon="ri-lock-password-line"
                    />
                  </div>
                </div>
                <p
                  className={`${colorClasses.textTerciary} text-sm font-normal leading-normal pb-3 pt-1 px-4 underline cursor-pointer`}
                >
                  ¿Olvidaste tu contraseña?
                </p>
                <div className="flex max-w-[480px] px-4 py-3">
                  <R2MButton
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    loading={isLoading}
                    variant="secondary"
                    size="md"
                    fullWidth
                  >
                    Iniciar sesión
                  </R2MButton>
                </div>
              </form>
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
              className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-white text-gray-900 border-green-100'
                  : 'bg-white text-gray-900 border-red-100'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  toast.type === 'success'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {toast.type === 'success' ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 9v4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 17h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium max-w-md">
                  {toast.message}
                </div>
              </div>
              <button
                className="ml-3 text-sm underline text-gray-500 whitespace-nowrap"
                onClick={() => setToast(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
