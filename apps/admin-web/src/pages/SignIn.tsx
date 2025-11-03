import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle, signInWithMicrosoft } from '../api/auth_api';
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

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // La redirección se manejará automáticamente por Supabase
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Error al iniciar sesión con Google',
      );
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithMicrosoft();
      // La redirección se manejará automáticamente por Supabase
    } catch (error) {
      console.error('Error al iniciar sesión con Microsoft:', error);
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Error al iniciar sesión con Microsoft',
      );
      setIsLoading(false);
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
        className={`relative flex size-full min-h-screen flex-col ${colorClasses.bgPage} group/design-root overflow-x-hidden`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <AuthHeader showSignUp={true} />
          <div className="flex flex-1 justify-center py-10">
            <div className="flex flex-col items-center w-full max-w-[480px] px-4 py-5">
              <h2
                className={`${colorClasses.textPrimary} tracking-light text-[28px] font-bold leading-tight text-center pb-3 pt-5 w-full`}
              >
                Inicia sesión en tu cuenta
              </h2>
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col gap-4 py-3">
                  <div className="flex flex-col">
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
                  <div className="flex flex-col">
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
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className={`${colorClasses.textTerciary} text-sm font-normal leading-normal underline cursor-pointer hover:text-[#1E56A0] transition-colors`}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                  <div className="pt-3">
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

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className={`${colorClasses.textSecondary} text-sm`}>
                      o
                    </span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Google Sign In Button */}
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.8789 15.7789 19.9895 13.221 19.9895 10.1871Z"
                          fill="#4285F4"
                        />
                        <path
                          d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9465L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z"
                          fill="#34A853"
                        />
                        <path
                          d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z"
                          fill="#EB4335"
                        />
                      </svg>
                      <span
                        className={`${colorClasses.textPrimary} text-base font-medium`}
                      >
                        Continuar con Google
                      </span>
                    </button>

                    {/* Microsoft Sign In Button */}
                    <button
                      type="button"
                      onClick={handleMicrosoftSignIn}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 23 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M0 0H10.8235V10.8235H0V0Z" fill="#F25022" />
                        <path
                          d="M12.1765 0H23V10.8235H12.1765V0Z"
                          fill="#7FBA00"
                        />
                        <path
                          d="M0 12.1765H10.8235V23H0V12.1765Z"
                          fill="#00A4EF"
                        />
                        <path
                          d="M12.1765 12.1765H23V23H12.1765V12.1765Z"
                          fill="#FFB900"
                        />
                      </svg>
                      <span
                        className={`${colorClasses.textPrimary} text-base font-medium`}
                      >
                        Continuar con Microsoft
                      </span>
                    </button>
                  </div>
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
              className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border bg-white ${
                toast.type === 'success'
                  ? `${colorClasses.textPrimary} border-green-100`
                  : `${colorClasses.textPrimary} border-red-100`
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
                <div
                  className={`text-sm font-medium max-w-md ${colorClasses.textPrimary}`}
                >
                  {toast.message}
                </div>
              </div>
              <button
                className={`ml-3 text-sm underline ${colorClasses.textTerciary} whitespace-nowrap`}
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
