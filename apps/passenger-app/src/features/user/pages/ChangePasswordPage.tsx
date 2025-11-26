import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiArrowLeftLine, RiLockPasswordLine } from 'react-icons/ri';
import { useAuth } from '../../auth/hooks/useAuth';
import { updatePassword } from '../services/userService';
import R2MInput from '../../../shared/components/R2MInput';
import R2MButton from '../../../shared/components/R2MButton';
import ErrorNotification from '../../system/components/ErrorNotification';
import useErrorNotification from '../../system/hooks/useErrorNotification';

interface PasswordData {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const router = useIonRouter();
  const { accessToken } = useAuth();
  const { error, handleError, clearError } = useErrorNotification();
  const contentRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    newPassword: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (value: string) => {
    if (value.length === 0) {
      setFieldErrors({ ...fieldErrors, newPassword: undefined });
      return;
    }

    // Validar longitud mínima
    if (value.length < 8) {
      setFieldErrors({
        ...fieldErrors,
        newPassword: 'La contraseña debe tener al menos 8 caracteres',
      });
      return;
    }

    // Validar que contenga minúsculas
    if (!/[a-z]/.test(value)) {
      setFieldErrors({
        ...fieldErrors,
        newPassword: 'La contraseña debe contener al menos una letra minúscula',
      });
      return;
    }

    // Validar que contenga mayúsculas
    if (!/[A-Z]/.test(value)) {
      setFieldErrors({
        ...fieldErrors,
        newPassword: 'La contraseña debe contener al menos una letra mayúscula',
      });
      return;
    }

    // Validar que contenga números
    if (!/\d/.test(value)) {
      setFieldErrors({
        ...fieldErrors,
        newPassword: 'La contraseña debe contener al menos un número',
      });
      return;
    }

    // Validar que contenga caracteres especiales
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(value)) {
      setFieldErrors({
        ...fieldErrors,
        newPassword:
          'La contraseña debe contener al menos un carácter especial',
      });
      return;
    }

    setFieldErrors({ ...fieldErrors, newPassword: undefined });
  };

  const validateConfirmPassword = (value: string) => {
    if (value === passwordData.newPassword) {
      setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
    } else {
      setFieldErrors({
        ...fieldErrors,
        confirmPassword: 'Las contraseñas no coinciden',
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    // Validaciones completas de contraseña
    if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/[a-z]/.test(passwordData.newPassword)) {
      errors.newPassword =
        'La contraseña debe contener al menos una letra minúscula';
    } else if (!/[A-Z]/.test(passwordData.newPassword)) {
      errors.newPassword =
        'La contraseña debe contener al menos una letra mayúscula';
    } else if (!/\d/.test(passwordData.newPassword)) {
      errors.newPassword = 'La contraseña debe contener al menos un número';
    } else if (
      !/[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(passwordData.newPassword)
    ) {
      errors.newPassword =
        'La contraseña debe contener al menos un carácter especial';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    if (!accessToken) {
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(accessToken, passwordData.newPassword);
      router.push('/perfil', 'back');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/perfil', 'back');
  };

  useIonViewDidEnter(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
    if (backButtonRef.current) {
      backButtonRef.current.tabIndex = 0;
    }
  });

  useEffect(() => {
    if (backButtonRef.current) {
      backButtonRef.current.tabIndex = -1;
    }
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <ErrorNotification error={error} onClose={clearError} />

        <button
          ref={backButtonRef}
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-50 p-2 rounded-full transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
          tabIndex={-1}
          aria-label="Volver atrás"
        >
          <RiArrowLeftLine
            size={24}
            style={{ color: 'var(--color-primary)' }}
          />
        </button>

        <div
          ref={contentRef}
          className="flex flex-col min-h-full px-6"
          tabIndex={-1}
        >
          <div className="flex-shrink-0 pt-8"></div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-6 flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(22, 49, 114, 0.1)' }}
                >
                  <RiLockPasswordLine
                    size={40}
                    style={{ color: 'var(--color-primary)' }}
                  />
                </div>
              </div>

              <div className="mb-8 text-center">
                <p
                  className="font-bold mb-2"
                  style={{ color: 'var(--color-primary)', fontSize: '24px' }}
                >
                  Cambiar contraseña
                </p>
                <p
                  style={{
                    color: 'var(--color-terciary)',
                    fontSize: '14px',
                  }}
                >
                  Ingresa tu nueva contraseña
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <R2MInput
                    type="password"
                    placeholder="Nueva contraseña"
                    value={passwordData.newPassword}
                    onValueChange={(value) => {
                      setPasswordData({ ...passwordData, newPassword: value });
                      validatePassword(value);
                      if (passwordData.confirmPassword) {
                        validateConfirmPassword(passwordData.confirmPassword);
                      }
                    }}
                    required
                    error={fieldErrors.newPassword}
                    hasError={!!fieldErrors.newPassword}
                  />
                </div>

                <div className="mb-6">
                  <R2MInput
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={passwordData.confirmPassword}
                    onValueChange={(value) => {
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: value,
                      });
                      validateConfirmPassword(value);
                    }}
                    required
                    error={fieldErrors.confirmPassword}
                    hasError={!!fieldErrors.confirmPassword}
                  />
                </div>

                <div className="flex justify-center">
                  <div className="w-full">
                    <R2MButton
                      type="submit"
                      variant="primary"
                      size="large"
                      disabled={isLoading}
                      loading={isLoading}
                      fullWidth
                    >
                      Cambiar contraseña
                    </R2MButton>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
