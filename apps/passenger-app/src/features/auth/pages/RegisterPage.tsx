import { useState } from 'react';
import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import {
  RiUser5Line,
  RiUser5Fill,
  RiBriefcase4Line,
  RiBriefcase4Fill,
  RiKey2Line,
  RiArrowLeftLine,
  RiMailSendFill,
} from 'react-icons/ri';
import R2MInput from '../../../shared/components/R2MInput';
import R2MButton from '../../../shared/components/R2MButton';
import R2MTextLink from '../../../shared/components/R2MTextLink';
import R2MCodeInput from '../../../shared/components/R2MCodeInput';
import ErrorNotification, {
  useErrorNotification,
} from '../../../features/system/components/ErrorNotification';
import { signupUser, validateAuthConfig } from '../services/authService';
import '../components/R2MInput.css';

// Tipos para el registro
interface PersonalData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface CompanyData {
  organizationKey: string[];
}

type AccountPurpose = 'personal' | 'organization';

export default function RegisterPage() {
  const router = useIonRouter();
  const { error, handleError, clearError } = useErrorNotification();

  // Estados para las fases
  const [currentPhase, setCurrentPhase] = useState(1);
  const [personalData, setPersonalData] = useState<PersonalData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  // Estados para errores de campos específicos
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    organizationKey?: string;
  }>({});

  // Función para formatear el teléfono
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

  // Función para manejar el cambio del teléfono
  const handlePhoneChange = (value: string) => {
    // Permitir borrar completamente
    if (value === '') {
      setPersonalData({ ...personalData, phone: '' });
      setFieldErrors({ ...fieldErrors, phone: undefined });
      return;
    }

    const formatted = formatPhoneNumber(value);
    setPersonalData({ ...personalData, phone: formatted });

    // Validar teléfono en tiempo real
    const phoneNumbers = formatted.replaceAll(/\D/g, '');
    if (phoneNumbers.length > 0 && phoneNumbers.length !== 10) {
      setFieldErrors({
        ...fieldErrors,
        phone: 'El teléfono debe tener 10 dígitos',
      });
    } else {
      setFieldErrors({ ...fieldErrors, phone: undefined });
    }
  };

  // Funciones de validación en tiempo real
  const validateName = (value: string) => {
    if (value.trim()) {
      setFieldErrors({ ...fieldErrors, name: undefined });
    } else {
      setFieldErrors({ ...fieldErrors, name: 'El nombre es requerido' });
    }
  };

  const validateEmail = (value: string) => {
    if (value.trim() && value.includes('@') && value.includes('.')) {
      setFieldErrors({ ...fieldErrors, email: undefined });
    } else if (value.trim()) {
      setFieldErrors({
        ...fieldErrors,
        email: 'Ingresa un correo electrónico válido',
      });
    } else {
      setFieldErrors({
        ...fieldErrors,
        email: 'El correo electrónico es requerido',
      });
    }
  };

  const validatePassword = (value: string) => {
    if (value.length > 0 && value.length < 6) {
      setFieldErrors({
        ...fieldErrors,
        password: 'La contraseña debe tener al menos 6 caracteres',
      });
    } else {
      setFieldErrors({ ...fieldErrors, password: undefined });
    }
  };

  const validateConfirmPassword = (value: string) => {
    if (value === personalData.password) {
      setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
    } else {
      setFieldErrors({
        ...fieldErrors,
        confirmPassword: 'Las contraseñas no coinciden',
      });
    }
  };
  const [accountPurpose, setAccountPurpose] = useState<AccountPurpose | null>(
    null,
  );
  const [companyData, setCompanyData] = useState<CompanyData>({
    organizationKey: ['', '', '', '', '', ''],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Validaciones básicas
  const validatePersonalData = () => {
    const { name, email, password, confirmPassword } = personalData;
    const errors: typeof fieldErrors = {};

    if (!name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (personalData.phone) {
      const phoneNumbers = personalData.phone.replaceAll(/\D/g, '');
      if (phoneNumbers.length !== 10) {
        errors.phone = 'El teléfono debe tener 10 dígitos';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCompanyData = () => {
    const { organizationKey } = companyData;
    const fullKey = organizationKey.join('');
    const errors: typeof fieldErrors = {};

    if (fullKey.length !== 6) {
      errors.organizationKey = 'La clave debe tener exactamente 6 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navegación entre fases
  const handleNextPhase = () => {
    if (showConfirmation) {
      // Redirigir al login desde la vista de confirmación
      router.push('/login', 'forward');
      return;
    }

    if (currentPhase === 1) {
      if (validatePersonalData()) {
        setCurrentPhase(2);
      }
    } else if (currentPhase === 2) {
      if (accountPurpose === 'organization') {
        setCurrentPhase(3);
      } else {
        handleFinalSubmit();
      }
    } else if (currentPhase === 3) {
      if (validateCompanyData()) {
        handleFinalSubmit();
      }
    }
  };

  const handlePreviousPhase = () => {
    if (showConfirmation) {
      // Desde la vista de confirmación, ir al Welcome
      router.push('/welcome', 'back');
      return;
    }

    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  // Envío final del formulario
  const handleFinalSubmit = async () => {
    setIsLoading(true);

    try {
      // Validar configuración de autenticación
      validateAuthConfig();

      // Construir el payload según el formato de Supabase
      const phoneNumbers = personalData.phone.replaceAll(/\D/g, '');
      const signupData = {
        email: personalData.email,
        password: personalData.password,
        data: {
          name: personalData.name,
          phone: personalData.phone ? `+57${phoneNumbers}` : '',
          company_key:
            accountPurpose === 'organization'
              ? companyData.organizationKey.join('')
              : '',
        },
      };

      console.log('Register payload:', signupData);

      // Realizar el registro con Supabase
      const response = await signupUser(signupData);

      console.log('Registro exitoso:', response);

      // Mostrar vista de confirmación
      setRegisteredEmail(response.email);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error en el registro:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Vista de confirmación de registro
  const renderConfirmationView = () => (
    <div className="w-full max-w-md">
      <div className="text-center">
        {/* Icono principal con mejor jerarquía */}
        <div className="w-28 h-28 mx-auto flex items-center justify-center">
          <RiMailSendFill size={72} style={{ color: 'var(--color-primary)' }} />
        </div>

        {/* Título principal */}
        <div className="mb-6">
          <h1
            className="font-bold mb-3"
            style={{ color: 'var(--color-primary)', fontSize: '28px' }}
          >
            ¡Registro completado!
          </h1>
        </div>

        {/* Mensaje principal */}
        <div className="mb-8">
          <p
            className="mb-4"
            style={{
              color: 'var(--color-text)',
              fontSize: '16px',
              lineHeight: '1.4',
            }}
          >
            Se ha enviado un correo de confirmación a:
          </p>

          {/* Email destacado */}
          <div
            className="inline-block px-6 py-3 rounded-lg border-2"
            style={{
              backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)',
              borderColor: 'rgba(var(--color-primary-rgb), 0.2)',
            }}
          >
            <p
              className="font-semibold"
              style={{
                color: 'var(--color-primary)',
                fontSize: '16px',
                wordBreak: 'break-all',
                lineHeight: '1.3',
              }}
            >
              {registeredEmail}
            </p>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mb-6">
          <p
            className="text-center"
            style={{
              color: 'var(--color-terciary)',
              fontSize: '15px',
              lineHeight: '1.5',
            }}
          >
            Revisa tu bandeja de entrada y sigue las instrucciones para activar
            tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );

  // Renderizado de la fase actual
  const renderCurrentPhase = () => {
    if (showConfirmation) {
      return renderConfirmationView();
    }

    switch (currentPhase) {
      case 1:
        return renderPersonalDataPhase();
      case 2:
        return renderPurposePhase();
      case 3:
        return renderCompanyDataPhase();
      default:
        return null;
    }
  };

  // Función para obtener el texto del botón
  const getButtonText = () => {
    if (showConfirmation) {
      return 'Iniciar sesión';
    }
    if (currentPhase === 1) {
      return 'Continuar';
    } else if (currentPhase === 2 && accountPurpose === 'personal') {
      return 'Finalizar';
    } else if (currentPhase === 2) {
      return 'Continuar';
    } else {
      return 'Finalizar';
    }
  };

  // Renderizado de botones de navegación
  const renderNavigationButtons = () => {
    // Botón continuar/finalizar (siempre visible)
    return (
      <div className="flex justify-center">
        <div className="w-64">
          <R2MButton
            type="button"
            variant="primary"
            size="large"
            onClick={handleNextPhase}
            disabled={
              currentPhase === 2 && !accountPurpose && !showConfirmation
            }
            loading={isLoading}
            fullWidth
          >
            {getButtonText()}
          </R2MButton>
        </div>
      </div>
    );
  };

  // Fase 1: Datos personales
  const renderPersonalDataPhase = () => (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1
          className="font-bold mb-2"
          style={{ color: 'var(--color-primary)', fontSize: '24px' }}
        >
          Crear cuenta
        </h1>
        <p
          style={{
            color: 'var(--color-terciary)',
            fontSize: '14px',
          }}
        >
          Ingresa tus datos personales
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNextPhase();
        }}
      >
        {/* Nombre */}
        <div className="mb-4">
          <R2MInput
            type="name"
            placeholder="Nombre completo"
            value={personalData.name}
            onValueChange={(value) => {
              setPersonalData({ ...personalData, name: value });
              validateName(value);
            }}
            required
            error={fieldErrors.name}
            hasError={!!fieldErrors.name}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <R2MInput
            type="email"
            placeholder="Correo electrónico"
            value={personalData.email}
            onValueChange={(value) => {
              setPersonalData({ ...personalData, email: value });
              validateEmail(value);
            }}
            required
            error={fieldErrors.email}
            hasError={!!fieldErrors.email}
          />
        </div>

        {/* Contraseña */}
        <div className="mb-4">
          <R2MInput
            type="password"
            placeholder="Contraseña"
            value={personalData.password}
            onValueChange={(value) => {
              setPersonalData({ ...personalData, password: value });
              validatePassword(value);
              // También validar confirmPassword si ya tiene valor
              if (personalData.confirmPassword) {
                validateConfirmPassword(personalData.confirmPassword);
              }
            }}
            required
            error={fieldErrors.password}
            hasError={!!fieldErrors.password}
          />
        </div>

        {/* Confirmar contraseña */}
        <div className="mb-4">
          <R2MInput
            type="password"
            placeholder="Confirmar contraseña"
            value={personalData.confirmPassword}
            onValueChange={(value) => {
              setPersonalData({ ...personalData, confirmPassword: value });
              validateConfirmPassword(value);
            }}
            required
            error={fieldErrors.confirmPassword}
            hasError={!!fieldErrors.confirmPassword}
          />
        </div>

        {/* Teléfono (opcional) */}
        <div className="mb-6">
          <R2MInput
            type="phone"
            placeholder="300 123 4567"
            value={personalData.phone}
            onValueChange={handlePhoneChange}
            showOptional
            error={fieldErrors.phone}
            hasError={!!fieldErrors.phone}
          />
        </div>
      </form>
    </div>
  );

  // Fase 2: Propósito de la cuenta
  const renderPurposePhase = () => (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1
          className="font-bold mb-2"
          style={{ color: 'var(--color-primary)', fontSize: '24px' }}
        >
          Propósito de la cuenta
        </h1>
        <p
          style={{
            color: 'var(--color-terciary)',
            fontSize: '14px',
          }}
        >
          ¿Para qué usarás Rout2Me?
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Opción Personal */}
        <button
          type="button"
          onClick={() => setAccountPurpose('personal')}
          className={`flex-1 aspect-square p-6 border-2 transition-all duration-300 flex flex-col items-center justify-center bg-white ${
            accountPurpose === 'personal'
              ? 'border-blue-500 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
          style={{ borderRadius: '16px' }}
        >
          <div
            className="mb-3 flex items-center justify-center"
            style={{ width: '48px', height: '48px' }}
          >
            <div className="relative" style={{ width: '48px', height: '48px' }}>
              <RiUser5Line
                size={48}
                className={`absolute top-0 left-0 transition-all duration-300 ${
                  accountPurpose === 'personal'
                    ? 'opacity-0 scale-75'
                    : 'opacity-100 scale-100'
                }`}
                style={{ color: 'var(--color-terciary)' }}
              />
              <RiUser5Fill
                size={48}
                className={`absolute top-0 left-0 transition-all duration-300 ${
                  accountPurpose === 'personal'
                    ? 'opacity-100 scale-100 icon-bounce'
                    : 'opacity-0 scale-75'
                }`}
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
          </div>
          <h3 className="font-semibold text-lg text-center">Personal</h3>
        </button>

        {/* Opción Organización */}
        <button
          type="button"
          onClick={() => setAccountPurpose('organization')}
          className={`flex-1 aspect-square p-6 border-2 transition-all duration-300 flex flex-col items-center justify-center bg-white ${
            accountPurpose === 'organization'
              ? 'border-blue-500 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
          style={{ borderRadius: '16px' }}
        >
          <div
            className="mb-3 flex items-center justify-center"
            style={{ width: '48px', height: '48px' }}
          >
            <div className="relative" style={{ width: '48px', height: '48px' }}>
              <RiBriefcase4Line
                size={48}
                className={`absolute top-0 left-0 transition-all duration-300 ${
                  accountPurpose === 'organization'
                    ? 'opacity-0 scale-75'
                    : 'opacity-100 scale-100'
                }`}
                style={{ color: 'var(--color-terciary)' }}
              />
              <RiBriefcase4Fill
                size={48}
                className={`absolute top-0 left-0 transition-all duration-300 ${
                  accountPurpose === 'organization'
                    ? 'opacity-100 scale-100 icon-bounce'
                    : 'opacity-0 scale-75'
                }`}
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
          </div>
          <h3 className="font-semibold text-lg text-center">Organización</h3>
        </button>
      </div>

      {/* Descripción de la opción seleccionada */}
      {accountPurpose && (
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600">
            {accountPurpose === 'personal'
              ? 'Para uso personal y familiar'
              : 'Para empresas y organizaciones'}
          </p>
        </div>
      )}
    </div>
  );

  // Fase 3: Clave única de la organización
  const renderCompanyDataPhase = () => (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <RiKey2Line size={48} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h1
          className="font-bold mb-2"
          style={{ color: 'var(--color-primary)', fontSize: '24px' }}
        >
          Clave de la organización
        </h1>
        <p
          style={{
            color: 'var(--color-terciary)',
            fontSize: '14px',
          }}
        >
          Ingresa la clave única proporcionada por tu organización
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNextPhase();
        }}
      >
        {/* Campo de clave única */}
        <div className="mb-6">
          <R2MCodeInput
            length={6}
            value={companyData.organizationKey}
            onChange={(newKey) =>
              setCompanyData({ ...companyData, organizationKey: newKey })
            }
            type="alphanumeric"
            autoFocus
          />
          <p
            className="text-center text-sm mt-4"
            style={{ color: 'var(--color-terciary)' }}
          >
            Puedes copiar y pegar la clave completa
          </p>
        </div>
      </form>
    </div>
  );

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        {/* Notificación de error */}
        <ErrorNotification error={error} onClose={clearError} />
        {/* Botón de retroceso - visible después de la fase 1 y en confirmación */}
        {(currentPhase > 1 || showConfirmation) && (
          <button
            onClick={handlePreviousPhase}
            className="absolute top-4 left-4 z-5 p-2 rounded-full transition-colors"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }}
            tabIndex={0}
          >
            <RiArrowLeftLine
              size={24}
              style={{ color: 'var(--color-primary)' }}
            />
          </button>
        )}

        <div className="flex flex-col min-h-full px-6">
          {/* Indicador de progreso fijo */}
          <div className="flex-shrink-0 pt-8"></div>
          <div className="flex-shrink-0 pb-4"></div>

          {/* Indicador de progreso fijo - solo visible si no es confirmación */}
          {!showConfirmation && (
            <div className="flex-shrink-0 mb-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-terciary)' }}
                >
                  Paso {currentPhase} de {accountPurpose === 'personal' ? 2 : 3}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {Math.round(
                    (currentPhase / (accountPurpose === 'personal' ? 2 : 3)) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    width: `${(currentPhase / (accountPurpose === 'personal' ? 2 : 3)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Contenido de la fase actual - área flexible */}
          <div className="flex-1 flex items-center justify-center">
            {renderCurrentPhase()}
          </div>

          {/* Botones de navegación fijos */}
          <div className="flex-shrink-0 py-6">{renderNavigationButtons()}</div>

          {/* Footer fijo con link de login - solo visible si no es confirmación */}
          {!showConfirmation && (
            <div className="flex-shrink-0 pb-8">
              <div className="text-center">
                <span
                  style={{ color: 'var(--color-terciary)', fontSize: '14px' }}
                >
                  ¿Ya tienes cuenta?{' '}
                </span>
                <R2MTextLink
                  variant="secondary"
                  size="small"
                  onClick={() => router.push('/login', 'forward')}
                >
                  Inicia sesión
                </R2MTextLink>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
