import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../api/auth_api';
import { colorClasses } from '../styles/colors';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
    <div
      className="relative flex h-auto min-h-screen w-full flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] px-10 py-3">
          <div
            className={`flex items-center gap-4 ${colorClasses.textPrimary}`}
          >
            <div className="size-4">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2
              className={`${colorClasses.textPrimary} text-lg font-bold leading-tight tracking-[-0.015em]`}
            >
              Route2Me Admin
            </h2>
          </div>
          <button
            onClick={() => navigate('/signin')}
            className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 ${colorClasses.btnSecondary} text-sm font-bold leading-normal tracking-[0.015em] transition-colors`}
          >
            Iniciar Sesión
          </button>
        </header>
        <div className="flex flex-1 justify-center py-10">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5">
            <h2
              className={`${colorClasses.textPrimary} tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5`}
            >
              Crea tu cuenta
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="${colorClasses.textPrimary} text-base font-medium leading-normal pb-2">
                    Correo electrónico
                  </p>
                  <input
                    type="email"
                    name="email"
                    placeholder="Ingresa tu correo electrónico"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl ${colorClasses.textPrimary} focus:outline-0 focus:ring-0 border bg-white h-14 placeholder:${colorClasses.textTerciary} p-[15px] text-base font-normal leading-normal ${
                      touched.email && errors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D6E4F0] focus:border-[#D6E4F0]'
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                  />
                  {touched.email && errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="${colorClasses.textPrimary} text-base font-medium leading-normal pb-2">
                    Contraseña
                  </p>
                  <input
                    type="password"
                    name="password"
                    placeholder="Ingresa tu contraseña"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl ${colorClasses.textPrimary} focus:outline-0 focus:ring-0 border bg-white h-14 placeholder:${colorClasses.textTerciary} p-[15px] text-base font-normal leading-normal ${
                      touched.password && errors.password
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D6E4F0] focus:border-[#D6E4F0]'
                    }`}
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                  />
                  {touched.password && errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="${colorClasses.textPrimary} text-base font-medium leading-normal pb-2">
                    Nombre
                  </p>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ingresa tu nombre"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl ${colorClasses.textPrimary} focus:outline-0 focus:ring-0 border bg-white h-14 placeholder:${colorClasses.textTerciary} p-[15px] text-base font-normal leading-normal ${
                      touched.name && errors.name
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D6E4F0] focus:border-[#D6E4F0]'
                    }`}
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                  />
                  {touched.name && errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="${colorClasses.textPrimary} text-base font-medium leading-normal pb-2">
                    Teléfono
                  </p>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Ingresa tu número de teléfono"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl ${colorClasses.textPrimary} focus:outline-0 focus:ring-0 border bg-white h-14 placeholder:${colorClasses.textTerciary} p-[15px] text-base font-normal leading-normal ${
                      touched.phone && errors.phone
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D6E4F0] focus:border-[#D6E4F0]'
                    }`}
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </label>
              </div>
              <div className="flex px-4 py-3">
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className={`flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-12 px-5 flex-1 text-white text-base font-bold leading-normal tracking-[0.015em] ${
                    isFormValid && !loading
                      ? colorClasses.btnSecondary
                      : 'bg-[#97A3B1] cursor-not-allowed'
                  }`}
                >
                  <span className="truncate">
                    {loading ? 'Registrando...' : 'Registrarse'}
                  </span>
                </button>
              </div>
            </form>
            <p
              className={`${colorClasses.textTerciary} text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center`}
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
  );
}
