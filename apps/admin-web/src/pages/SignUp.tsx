import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../api/auth_api';
import { colorClasses } from '../styles/colors';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';
import AuthHeader from '../components/AuthHeader';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
  }>({});

  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
    name?: boolean;
    phone?: boolean;
  }>({});

  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
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
      // Aumentado a 6 segundos para que se pueda leer
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
      name?: string;
      phone?: string;
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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe contener mayúsculas, minúsculas y números';
    }

    // Validación de nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validación de teléfono
    const phoneRegex = /^\d{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'El teléfono debe tener 10 dígitos';
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
      name: true,
      phone: true,
    });

    if (validateForm()) {
      setLoading(true);
      try {
        await signUp(formData);
        showToast(
          'success',
          'Cuenta creada exitosamente. Por favor verifica tu correo electrónico.',
        );
        // Redirigir a SignIn después de 5 segundos para que alcance a leer el mensaje
        setTimeout(() => {
          navigate('/signin');
        }, 5000);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error al crear la cuenta. Por favor intenta nuevamente.';
        showToast('error', errorMessage);
      } finally {
        setLoading(false);
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
        className={`relative flex size-full min-h-screen flex-col ${colorClasses.bgPage} group/design-root overflow-x-hidden`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <AuthHeader showSignUp={false} />
          <div className="flex flex-1 justify-center py-10">
            <div className="flex flex-col items-center w-full max-w-[480px] px-4 py-5">
              <h2
                className={`${colorClasses.textPrimary} tracking-light text-[28px] font-bold leading-tight text-center pb-3 pt-5 w-full`}
              >
                Crea tu cuenta
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
                  <div className="flex flex-col">
                    <p
                      className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                    >
                      Nombre
                    </p>
                    <R2MInput
                      type="text"
                      placeholder="Ingresa tu nombre"
                      value={formData.name}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, name: value }))
                      }
                      onBlur={() => handleBlur('name')}
                      error={touched.name ? errors.name : undefined}
                      icon="ri-user-line"
                    />
                  </div>
                  <div className="flex flex-col">
                    <p
                      className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                    >
                      Teléfono
                    </p>
                    <R2MInput
                      type="tel"
                      placeholder="Ingresa tu número de teléfono"
                      value={formData.phone}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, phone: value }))
                      }
                      onBlur={() => handleBlur('phone')}
                      error={touched.phone ? errors.phone : undefined}
                      icon="ri-phone-line"
                    />
                  </div>
                  <div className="pt-3">
                    <R2MButton
                      type="submit"
                      disabled={!isFormValid || loading}
                      loading={loading}
                      variant="secondary"
                      size="md"
                      fullWidth
                    >
                      Registrarse
                    </R2MButton>
                  </div>
                </div>
              </form>
              <p
                className={`${colorClasses.textTerciary} text-sm font-normal leading-normal pb-3 pt-1 text-center w-full`}
              >
                Al registrarte, aceptas nuestros Términos de Servicio y Política
                de Privacidad.
              </p>
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
