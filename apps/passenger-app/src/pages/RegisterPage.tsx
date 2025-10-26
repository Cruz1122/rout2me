import { useState } from 'react';
import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import {
  RiUser5Line,
  RiUser5Fill,
  RiBriefcase4Line,
  RiBriefcase4Fill,
  RiKey2Line,
  RiArrowLeftLine,
} from 'react-icons/ri';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';
import R2MTextLink from '../components/R2MTextLink';
import R2MCodeInput from '../components/R2MCodeInput';
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
  // Estados para las fases
  const [currentPhase, setCurrentPhase] = useState(1);
  const [personalData, setPersonalData] = useState<PersonalData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

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
      return;
    }

    const formatted = formatPhoneNumber(value);
    setPersonalData({ ...personalData, phone: formatted });
  };
  const [accountPurpose, setAccountPurpose] = useState<AccountPurpose | null>(
    null,
  );
  const [companyData, setCompanyData] = useState<CompanyData>({
    organizationKey: ['', '', '', '', '', ''],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validaciones básicas
  const validatePersonalData = () => {
    const { name, email, password, confirmPassword } = personalData;

    if (!name.trim()) {
      alert('El nombre es requerido');
      return false;
    }

    if (!email.trim() || !email.includes('@')) {
      alert('Ingresa un correo electrónico válido');
      return false;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return false;
    }

    if (personalData.phone) {
      const phoneNumbers = personalData.phone.replaceAll(/\D/g, '');
      if (phoneNumbers.length !== 10) {
        alert('El teléfono debe tener 10 dígitos');
        return false;
      }
    }

    return true;
  };

  const validateCompanyData = () => {
    const { organizationKey } = companyData;
    const fullKey = organizationKey.join('');

    if (fullKey.length !== 6) {
      alert('La clave debe tener exactamente 6 caracteres');
      return false;
    }

    return true;
  };

  // Navegación entre fases
  const handleNextPhase = () => {
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
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  // Envío final del formulario
  const handleFinalSubmit = () => {
    setIsLoading(true);

    // Construir el payload según el propósito de la cuenta
    const phoneNumbers = personalData.phone.replaceAll(/\D/g, '');
    const payload = {
      email: personalData.email,
      password: personalData.password,
      name: personalData.name,
      phone: personalData.phone ? `+57${phoneNumbers}` : undefined,
      roles: accountPurpose === 'organization' ? ['ADMIN'] : ['USER'],
      ...(accountPurpose === 'organization' && {
        company: {
          mode: 'join',
          organization_key: companyData.organizationKey.join(''),
        },
      }),
    };

    console.log('Register payload:', payload);

    // Implementar lógica de registro con el backend
    setTimeout(() => {
      setIsLoading(false);
      alert('Registro completado (simulado)');
    }, 2000);
  };

  // Renderizado de la fase actual
  const renderCurrentPhase = () => {
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
            disabled={currentPhase === 2 && !accountPurpose}
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
            onValueChange={(value) =>
              setPersonalData({ ...personalData, name: value })
            }
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <R2MInput
            type="email"
            placeholder="Correo electrónico"
            value={personalData.email}
            onValueChange={(value) =>
              setPersonalData({ ...personalData, email: value })
            }
            required
          />
        </div>

        {/* Contraseña */}
        <div className="mb-4">
          <R2MInput
            type="password"
            placeholder="Contraseña"
            value={personalData.password}
            onValueChange={(value) =>
              setPersonalData({ ...personalData, password: value })
            }
            required
          />
        </div>

        {/* Confirmar contraseña */}
        <div className="mb-4">
          <R2MInput
            type="password"
            placeholder="Confirmar contraseña"
            value={personalData.confirmPassword}
            onValueChange={(value) =>
              setPersonalData({ ...personalData, confirmPassword: value })
            }
            required
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
        {/* Botón de retroceso - solo visible después de la fase 1 */}
        {currentPhase > 1 && (
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

          {/* Indicador de progreso fijo */}
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

          {/* Contenido de la fase actual - área flexible */}
          <div className="flex-1 flex items-center justify-center">
            {renderCurrentPhase()}
          </div>

          {/* Botones de navegación fijos */}
          <div className="flex-shrink-0 py-6">{renderNavigationButtons()}</div>

          {/* Footer fijo con link de login */}
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
        </div>
      </IonContent>
    </IonPage>
  );
}
