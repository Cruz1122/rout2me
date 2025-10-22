import { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  RiGoogleLine,
  RiGoogleFill,
  RiMicrosoftLine,
  RiMicrosoftFill,
} from 'react-icons/ri';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';
import R2MTextLink from '../components/R2MTextLink';

export default function LoginPage() {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredProvider, setHoveredProvider] = useState<
    'google' | 'microsoft' | null
  >(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Login attempt:', { email, password });
    // Implementar lógica de autenticación
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // Implementar lógica de autenticación con Google
  };

  const handleMicrosoftLogin = () => {
    console.log('Microsoft login clicked');
    // Implementar lógica de autenticación con Microsoft
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
          {/* Logo placeholder */}
          <div className="mb-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/icon.webp"
                alt="Rout2Me Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
            <h1
              className="font-bold"
              style={{ color: 'var(--color-primary)', fontSize: '24px' }}
            >
              ¡Bienvenido a Rout2Me!
            </h1>
            <p
              style={{
                color: 'var(--color-terciary)',
                fontSize: '14px',
                marginTop: '8px',
              }}
            >
              Inicia sesión para continuar.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="w-full max-w-md">
            {/* Campo de correo */}
            <div className="mb-4">
              <R2MInput
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onValueChange={setEmail}
                required
              />
            </div>

            {/* Campo de contraseña */}
            <div className="mb-6">
              <R2MInput
                type="password"
                placeholder="Contraseña"
                value={password}
                onValueChange={setPassword}
                required
              />
            </div>

            {/* Botón de login */}
            <div className="mb-4">
              <R2MButton
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isLoading}
              >
                Iniciar sesión
              </R2MButton>
            </div>

            {/* Link de olvidé contraseña */}
            <div className="text-center mb-6">
              <R2MTextLink
                variant="secondary"
                size="small"
                onClick={() => console.log('Forgot password clicked')}
              >
                Olvidé mi contraseña
              </R2MTextLink>
            </div>

            {/* Divisor */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full border-t"
                  style={{ borderColor: 'var(--color-surface)' }}
                ></div>
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-4"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-terciary)',
                    fontSize: '14px',
                  }}
                >
                  o continúa con
                </span>
              </div>
            </div>

            {/* Botones de inicio de sesión social */}
            <div className="flex gap-3 mb-6">
              {/* Botón de Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                onMouseEnter={() => setHoveredProvider('google')}
                onMouseLeave={() => setHoveredProvider(null)}
                className="flex-1 p-4 border-2 transition-all duration-300 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                style={{
                  borderRadius: '12px',
                  minHeight: '100px',
                  backgroundColor:
                    hoveredProvider === 'google' ? '#EA4335' : 'white',
                  borderColor:
                    hoveredProvider === 'google' ? '#EA4335' : '#e5e7eb',
                }}
              >
                <div
                  className="mb-2 flex items-center justify-center relative"
                  style={{ width: '32px', height: '32px' }}
                >
                  <RiGoogleLine
                    size={32}
                    className={`absolute top-0 left-0 transition-all duration-300 ${
                      hoveredProvider === 'google'
                        ? 'opacity-0 scale-75'
                        : 'opacity-100 scale-100'
                    }`}
                    style={{ color: 'var(--color-terciary)' }}
                  />
                  <RiGoogleFill
                    size={32}
                    className={`absolute top-0 left-0 transition-all duration-300 ${
                      hoveredProvider === 'google'
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-75'
                    }`}
                    style={{ color: 'white' }}
                  />
                </div>
                <h3
                  className="font-semibold text-center transition-colors duration-300"
                  style={{
                    fontSize: '14px',
                    color: hoveredProvider === 'google' ? 'white' : '#1f2937',
                  }}
                >
                  Google
                </h3>
              </button>

              {/* Botón de Microsoft */}
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                onMouseEnter={() => setHoveredProvider('microsoft')}
                onMouseLeave={() => setHoveredProvider(null)}
                className="flex-1 p-4 border-2 transition-all duration-300 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
                style={{
                  borderRadius: '12px',
                  minHeight: '100px',
                  backgroundColor:
                    hoveredProvider === 'microsoft' ? '#00A4EF' : 'white',
                  borderColor:
                    hoveredProvider === 'microsoft' ? '#00A4EF' : '#e5e7eb',
                }}
              >
                <div
                  className="mb-2 flex items-center justify-center relative"
                  style={{ width: '32px', height: '32px' }}
                >
                  <RiMicrosoftLine
                    size={32}
                    className={`absolute top-0 left-0 transition-all duration-300 ${
                      hoveredProvider === 'microsoft'
                        ? 'opacity-0 scale-75'
                        : 'opacity-100 scale-100'
                    }`}
                    style={{ color: 'var(--color-terciary)' }}
                  />
                  <RiMicrosoftFill
                    size={32}
                    className={`absolute top-0 left-0 transition-all duration-300 ${
                      hoveredProvider === 'microsoft'
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-75'
                    }`}
                    style={{ color: 'white' }}
                  />
                </div>
                <h3
                  className="font-semibold text-center transition-colors duration-300"
                  style={{
                    fontSize: '14px',
                    color:
                      hoveredProvider === 'microsoft' ? 'white' : '#1f2937',
                  }}
                >
                  Microsoft
                </h3>
              </button>
            </div>

            {/* Link de registro */}
            <div className="text-center">
              <span
                style={{ color: 'var(--color-terciary)', fontSize: '14px' }}
              >
                ¿No tienes cuenta?{' '}
              </span>
              <R2MTextLink
                variant="secondary"
                size="small"
                onClick={() => history.push('/register')}
              >
                Regístrate
              </R2MTextLink>
            </div>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
}
