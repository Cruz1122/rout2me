import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiArrowLeftLine, RiCamera2Line } from 'react-icons/ri';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getUserInfo,
  updateMyProfile,
  uploadAvatar,
  type UpdateProfileData,
} from '../services/userService';
import R2MInput from '../../../shared/components/R2MInput';
import R2MButton from '../../../shared/components/R2MButton';
import R2MLoader from '../../../shared/components/R2MLoader';
import R2MAvatar from '../../../shared/components/R2MAvatar';
import ErrorNotification from '../../system/components/ErrorNotification';
import useErrorNotification from '../../system/hooks/useErrorNotification';

interface ProfileData {
  name: string;
  phone: string;
  avatarUrl: string;
}

export default function EditProfilePage() {
  const router = useIonRouter();
  const { accessToken } = useAuth();
  const { error, handleError, clearError } = useErrorNotification();
  const contentRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    phone: '',
    avatarUrl: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para formatear el teléfono como XXX XXX XXXX
  const formatPhoneNumber = (value: string) => {
    // Remover todos los caracteres no numéricos
    const numbers = value.replaceAll(/\D/g, '');

    // Limitar a 10 dígitos
    const limitedNumbers = numbers.slice(0, 10);

    // Formatear como XXX XXX XXXX
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3, 6)} ${limitedNumbers.slice(6)}`;
    }
  };

  // Cargar datos del usuario al montar o cuando cambie el accessToken
  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      // Esperar a que el accessToken esté disponible
      if (!accessToken) {
        // No mostrar error si aún está cargando, solo esperar
        return;
      }

      try {
        if (isMounted) {
          setIsLoadingUser(true);
        }
        const userInfo = await getUserInfo(accessToken);
        if (isMounted) {
          // Remover el prefijo +57 del teléfono si existe, ya que el input lo muestra
          let phone = userInfo.user_metadata?.phone || '';
          if (phone.startsWith('+57')) {
            phone = phone.substring(3);
          }
          // Formatear el teléfono como XXX XXX XXXX
          phone = formatPhoneNumber(phone);

          setProfileData({
            name: userInfo.user_metadata?.name || '',
            phone: phone,
            avatarUrl: userInfo.user_metadata?.avatar_url || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          handleError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      handleError(new Error('Por favor selecciona una imagen válida'));
      return;
    }

    if (!accessToken) {
      return;
    }

    setIsUploadingAvatar(true);
    clearError();

    try {
      // Subir el avatar (la función Edge actualiza automáticamente los metadatos del usuario)
      await uploadAvatar(accessToken, file);

      // Recargar la información del usuario para obtener la nueva URL del avatar
      const updatedUserInfo = await getUserInfo(accessToken);

      // Actualizar el estado local con los nuevos datos
      setProfileData({
        ...profileData,
        avatarUrl: updatedUserInfo.user_metadata?.avatar_url || '',
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsUploadingAvatar(false);
      // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateName = (value: string) => {
    if (value.trim().length === 0) {
      setFieldErrors({ ...fieldErrors, name: 'El nombre es requerido' });
      return false;
    }
    if (value.trim().length < 2) {
      setFieldErrors({
        ...fieldErrors,
        name: 'El nombre debe tener al menos 2 caracteres',
      });
      return false;
    }
    setFieldErrors({ ...fieldErrors, name: undefined });
    return true;
  };

  const validatePhone = (value: string) => {
    // Remover espacios para validar
    const phoneNumbers = value.replaceAll(/\D/g, '');

    if (phoneNumbers.length === 0) {
      setFieldErrors({ ...fieldErrors, phone: undefined });
      return true; // Teléfono es opcional
    }
    // Validar formato de teléfono colombiano (10 dígitos)
    if (phoneNumbers.length !== 10) {
      setFieldErrors({
        ...fieldErrors,
        phone: 'El teléfono debe tener 10 dígitos',
      });
      return false;
    }
    setFieldErrors({ ...fieldErrors, phone: undefined });
    return true;
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (profileData.name.trim().length === 0) {
      errors.name = 'El nombre es requerido';
    } else if (profileData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (profileData.phone.trim().length > 0) {
      const phoneNumbers = profileData.phone.replaceAll(/\D/g, '');
      if (phoneNumbers.length !== 10) {
        errors.phone = 'El teléfono debe tener 10 dígitos';
      }
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
      const updateData: UpdateProfileData = {};

      // Solo incluir campos que han cambiado o que tienen valores
      if (profileData.name.trim()) {
        updateData._name = profileData.name.trim();
      }
      if (profileData.phone.trim()) {
        // Remover espacios del teléfono antes de enviar
        const phoneNumbers = profileData.phone.replaceAll(/\D/g, '');
        updateData._phone = phoneNumbers;
      }

      await updateMyProfile(accessToken, updateData);
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

  if (isLoadingUser) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <div className="flex items-center justify-center h-full">
            <R2MLoader />
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="relative focus:outline-none"
                    disabled={isUploadingAvatar}
                    aria-label="Cambiar foto de perfil"
                  >
                    <R2MAvatar
                      avatarUrl={profileData.avatarUrl}
                      userName={profileData.name}
                      size={80}
                      iconSize={40}
                    />
                    <div
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                      }}
                    >
                      {isUploadingAvatar ? (
                        <div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                          aria-label="Subiendo foto"
                        />
                      ) : (
                        <RiCamera2Line size={16} color="white" />
                      )}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-label="Seleccionar imagen"
                  />
                </div>
              </div>

              <div className="mb-8 text-center">
                <p
                  className="font-bold mb-2"
                  style={{ color: 'var(--color-primary)', fontSize: '24px' }}
                >
                  Editar perfil
                </p>
                <p
                  style={{
                    color: 'var(--color-terciary)',
                    fontSize: '14px',
                  }}
                >
                  Actualiza tu información personal
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <R2MInput
                    type="name"
                    placeholder="Nombre completo"
                    value={profileData.name}
                    onValueChange={(value) => {
                      setProfileData({ ...profileData, name: value });
                      validateName(value);
                    }}
                    required
                    error={fieldErrors.name}
                    hasError={!!fieldErrors.name}
                  />
                </div>

                <div className="mb-6">
                  <R2MInput
                    type="phone"
                    placeholder="Teléfono"
                    value={profileData.phone}
                    onValueChange={(value) => {
                      // Formatear el teléfono mientras el usuario escribe
                      const formatted = formatPhoneNumber(value);
                      setProfileData({ ...profileData, phone: formatted });
                      validatePhone(formatted);
                    }}
                    showOptional
                    error={fieldErrors.phone}
                    hasError={!!fieldErrors.phone}
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
                      Guardar cambios
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
