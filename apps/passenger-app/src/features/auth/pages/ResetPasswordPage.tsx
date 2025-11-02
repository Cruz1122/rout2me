import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiLockPasswordLine } from 'react-icons/ri';
import { updatePasswordWithToken } from '../services/authService';
import R2MInput from '../../../shared/components/R2MInput';
import R2MButton from '../../../shared/components/R2MButton';
import ErrorNotification from '../../system/components/ErrorNotification';
import useErrorNotification from '../../system/hooks/useErrorNotification';

interface PasswordData {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const router = useIonRouter();
  const { error, handleError, clearError } = useErrorNotification();
  const contentRef = useRef<HTMLDivElement>(null);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    newPassword: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Extraer el access_token del hash de la URL
  useEffect(() => {
    const hash = globalThis.location.hash;
    console.log('🔐 ResetPasswordPage - Hash completo:', hash);

    const params = new URLSearchParams(hash.substring(1)); // Remover el # inicial

    const token = params.get('access_token');
    const type = params.get('type');
    const expiresAt = params.get('expires_at');
    const expiresIn = params.get('expires_in');

    console.log(
      '🔐 Token extraído:',
      token ? `${token.substring(0, 20)}...` : 'null',
    );
    console.log('🔐 Type:', type);
    console.log('🔐 Expires at:', expiresAt);
    console.log('🔐 Expires in:', expiresIn, 'segundos');

    if (token && type === 'recovery') {
      console.log('✅ Token de recuperación válido detectado');
      setAccessToken(token);
    } else {
      console.error('❌ Token inválido o tipo incorrecto');
      // Redirigir a página de enlace expirado
      router.push('/expired-link', 'root');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  const validatePassword = (value: string) => {
    if (value.length > 0 && value.length < 6) {
      setFieldErrors({
        ...fieldErrors,
        newPassword: 'La contraseña debe tener al menos 6 caracteres',
      });
    } else {
      setFieldErrors({ ...fieldErrors, newPassword: undefined });
    }
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

    if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
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
      handleError(new Error('Token de recuperación no válido'));
      return;
    }

    setIsLoading(true);

    try {
      await updatePasswordWithToken(accessToken, passwordData.newPassword);

      // Redirigir al login con un mensaje de éxito
      router.push('/login', 'root');

      // Nota: Idealmente mostrarías un toast o mensaje de éxito
      console.log('Contraseña actualizada exitosamente');
    } catch (err) {
      // Si el error es de enlace expirado, redirigir a la página de enlace expirado
      const errorMessage = err instanceof Error ? err.message : '';
      if (
        errorMessage.toLowerCase().includes('expirado') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('invalid')
      ) {
        router.push('/expired-link', 'root');
      } else {
        handleError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewDidEnter(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  });

  // Si no hay token, mostrar un mensaje de carga o error
  if (!accessToken && !error) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <div className="flex items-center justify-center min-h-full">
            <p style={{ color: 'var(--color-terciary)' }}>
              Verificando enlace de recuperación...
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <ErrorNotification error={error} onClose={clearError} />

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
                  Restablecer contraseña
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
                      disabled={isLoading || !accessToken}
                      loading={isLoading}
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
      </IonContent>
    </IonPage>
  );
}
