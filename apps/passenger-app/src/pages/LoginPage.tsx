import { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import R2MInput from '../components/R2MInput';
import R2MButton from '../components/R2MButton';
import R2MTextLink from '../components/R2MTextLink';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Login attempt:', { email, password });
    // TODO: Implementar lógica de autenticación
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
          {/* Logo placeholder */}
          <div className="mb-12 text-center">
            <div
              className="w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: 'var(--color-primary)',
              }}
            >
              <span
                className="font-bold text-white"
                style={{ fontSize: '32px' }}
              >
                R2M
              </span>
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
                  o
                </span>
              </div>
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
                onClick={() => console.log('Register clicked')}
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
