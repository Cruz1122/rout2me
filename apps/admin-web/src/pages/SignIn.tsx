import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signIn } from '../api/auth_api';
import { useAuth } from '../context/AuthContext';
import { colorClasses } from '../styles/colors';

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
  const [showPassword, setShowPassword] = useState(false);
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
    <div
      className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
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
            onClick={() => navigate('/signup')}
            className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 ${colorClasses.btnSecondary} text-sm font-bold leading-normal tracking-[0.015em] transition-colors`}
          >
            Registrarse
          </button>
        </header>
        <div className="flex flex-1 justify-center py-10">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5">
            <h2
              className={`${colorClasses.textPrimary} tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5`}
            >
              Inicia sesión en tu cuenta
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p
                    className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                  >
                    Correo electrónico
                  </p>
                  <input
                    type="email"
                    name="email"
                    placeholder="Ingresa tu correo electrónico"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl ${colorClasses.textPrimary} focus:outline-0 focus:ring-0 border bg-white h-14 placeholder:text-[#97A3B1] p-[15px] text-base font-normal leading-normal ${
                      touched.email && errors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D6E4F0] focus:border-[#1E56A0]'
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
                  <p
                    className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                  >
                    Contraseña
                  </p>
                  <div className="flex w-full flex-1 items-stretch rounded-xl">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Ingresa tu contraseña"
                      className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl ${colorClasses.textPrimary} focus:outline-0 focus:ring-0 border bg-white h-14 placeholder:text-[#97A3B1] p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal ${
                        touched.password && errors.password
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#D6E4F0] focus:border-[#1E56A0]'
                      }`}
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                    />
                    <div
                      className={`${colorClasses.textTerciary} flex border bg-white items-center justify-center pr-[15px] rounded-r-xl border-l-0 cursor-pointer ${
                        touched.password && errors.password
                          ? 'border-red-500'
                          : 'border-[#D6E4F0]'
                      }`}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                      >
                        <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
                      </svg>
                    </div>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </label>
              </div>
              <p
                className={`${colorClasses.textTerciary} text-sm font-normal leading-normal pb-3 pt-1 px-4 underline cursor-pointer`}
              >
                ¿Olvidaste tu contraseña?
              </p>
              <div className="flex px-4 py-3">
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 flex-1 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors ${
                    isLoading || !isFormValid
                      ? 'bg-[#97A3B1] cursor-not-allowed'
                      : colorClasses.btnSecondary
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="truncate">Iniciando sesión...</span>
                    </div>
                  ) : (
                    <span className="truncate">Iniciar sesión</span>
                  )}
                </button>
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
  );
}
