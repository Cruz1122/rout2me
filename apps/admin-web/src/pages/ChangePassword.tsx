import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth_api';
import { useAuth } from '../context/AuthContext';
import { colorClasses } from '../styles/colors';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [touched, setTouched] = useState<{
    currentPassword?: boolean;
    newPassword?: boolean;
    confirmPassword?: boolean;
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
    // Si no hay usuario autenticado, redirigir a login
    if (!user) {
      navigate('/signin', { replace: true });
    }

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
      if (toastEntryTimerRef.current) clearTimeout(toastEntryTimerRef.current);
    };
  }, [user, navigate]);

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
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    // Validación de contraseña actual
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es obligatoria';
    }

    // Validación de nueva contraseña
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_\-])/.test(
        formData.newPassword,
      )
    ) {
      newErrors.newPassword =
        'Debe contener mayúsculas, minúsculas, números y un carácter especial (@$!%*?&.#_-)';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword =
        'La nueva contraseña debe ser diferente a la actual';
    }

    // Validación de confirmación de contraseña
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Debes confirmar tu nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
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
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (!validateForm() || !user) {
      return;
    }

    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('No se encontró el token de acceso');
      }

      // Primero verificar la contraseña actual intentando iniciar sesión
      const signInResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://rcdsqsvfxyfnrueoovpy.supabase.co'}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey:
              import.meta.env.VITE_SUPABASE_ANON_KEY ||
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZHNxc3ZmeHlmbnJ1ZW9vdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODk2MjEsImV4cCI6MjA3NTA2NTYyMX0.PRaW6F94PxYNaRGHx71U8vDBh4vA30Lol7n77L5hJN0',
          },
          body: JSON.stringify({
            email: user.email,
            password: formData.currentPassword,
          }),
        },
      );

      if (!signInResponse.ok) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Si la verificación fue exitosa, cambiar la contraseña
      await changePassword(
        accessToken,
        formData.newPassword,
        user.email,
        user.name || user.email,
        user.phone,
      );

      showToast('success', 'Contraseña actualizada exitosamente');

      // Esperar 2 segundos y cerrar sesión
      setTimeout(() => {
        clearAuth();
        navigate('/signin', {
          state: { message: 'Inicia sesión con tu nueva contraseña' },
        });
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al cambiar la contraseña. Por favor intenta nuevamente.';
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#F6F6F6]">
        {/* Header */}
        <div className="px-10 py-6 bg-white border-b border-[#E8EDF2]">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#F6F6F6] transition-colors"
              >
                <i className="ri-arrow-left-line text-xl text-[#163172]"></i>
              </button>
              <h1 className={`${colorClasses.textPrimary} text-2xl font-bold`}>
                Cambiar contraseña
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-[#E8EDF2] p-8">
              {/* User Info */}
              <div className="mb-8 pb-6 border-b border-[#E8EDF2]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#D6E4F0]">
                    <i className="ri-user-line text-2xl text-[#163172]"></i>
                  </div>
                  <div>
                    <h2
                      className={`${colorClasses.textPrimary} text-lg font-semibold`}
                    >
                      {user.name || user.email}
                    </h2>
                    <p className={`${colorClasses.textSecondary} text-sm`}>
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <p
                      className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                    >
                      Contraseña actual
                    </p>
                    <R2MInput
                      type="password"
                      placeholder="Ingresa tu contraseña actual"
                      value={formData.currentPassword}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          currentPassword: value,
                        }))
                      }
                      onBlur={() => handleBlur('currentPassword')}
                      error={
                        touched.currentPassword
                          ? errors.currentPassword
                          : undefined
                      }
                      icon="ri-lock-password-line"
                    />
                  </div>

                  <div className="flex flex-col">
                    <p
                      className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                    >
                      Nueva contraseña
                    </p>
                    <R2MInput
                      type="password"
                      placeholder="Ingresa tu nueva contraseña"
                      value={formData.newPassword}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, newPassword: value }))
                      }
                      onBlur={() => handleBlur('newPassword')}
                      error={
                        touched.newPassword ? errors.newPassword : undefined
                      }
                      icon="ri-lock-password-line"
                    />
                  </div>

                  <div className="flex flex-col">
                    <p
                      className={`${colorClasses.textPrimary} text-base font-medium leading-normal pb-2`}
                    >
                      Confirmar nueva contraseña
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

                  <div className="pt-4 flex gap-3">
                    <R2MButton
                      type="button"
                      variant="surface"
                      size="md"
                      onClick={() => navigate(-1)}
                    >
                      Cancelar
                    </R2MButton>
                    <R2MButton
                      type="submit"
                      disabled={!isFormValid || isLoading}
                      loading={isLoading}
                      variant="secondary"
                      size="md"
                    >
                      Cambiar contraseña
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
    </>
  );
}
