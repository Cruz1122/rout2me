import { useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import {
  RiSunLine,
  RiSunFill,
  RiMoonLine,
  RiMoonFill,
  RiArrowLeftLine,
} from 'react-icons/ri';
import { useTheme } from '../../../contexts/ThemeContext';

const ThemeSelectionPage: React.FC = () => {
  const router = useIonRouter();
  const { theme, setTheme } = useTheme();
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleThemeSelect = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
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
      <IonContent
        fullscreen
        className="ion-padding"
        style={{ '--background': 'var(--color-bg)' }}
      >
        <button
          ref={backButtonRef}
          onClick={handleGoBack}
          className="absolute top-4 left-4 z-50 p-2 transition-colors"
          style={{
            backgroundColor: 'transparent',
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
              <div className="mb-8 text-center">
                <p
                  className="font-bold mb-2"
                  style={{ color: 'var(--color-primary)', fontSize: '24px' }}
                >
                  Selecciona tu tema
                </p>
                <p
                  style={{
                    color: 'var(--color-terciary)',
                    fontSize: '14px',
                  }}
                >
                  Elige el tema que prefieras para tu aplicación
                </p>
              </div>

              <div className="flex gap-4 mb-6">
                {/* Opción Claro */}
                <button
                  type="button"
                  onClick={() => handleThemeSelect('light')}
                  className={`flex-1 aspect-square p-6 border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                    theme === 'light'
                      ? 'border-primary shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
                  style={{
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-card)',
                  }}
                >
                  <div
                    className="mb-3 flex items-center justify-center"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <div
                      className="relative"
                      style={{ width: '48px', height: '48px' }}
                    >
                      <RiSunLine
                        size={48}
                        className={`absolute top-0 left-0 transition-all duration-300 ${
                          theme === 'light'
                            ? 'opacity-0 scale-75'
                            : 'opacity-100 scale-100'
                        }`}
                        style={{ color: 'var(--color-terciary)' }}
                      />
                      <RiSunFill
                        size={48}
                        className={`absolute top-0 left-0 transition-all duration-300 ${
                          theme === 'light'
                            ? 'opacity-100 scale-100 icon-bounce'
                            : 'opacity-0 scale-75'
                        }`}
                        style={{ color: 'var(--color-primary)' }}
                      />
                    </div>
                  </div>
                  <h3
                    className="font-semibold text-lg text-center"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Claro
                  </h3>
                </button>

                {/* Opción Oscuro */}
                <button
                  type="button"
                  onClick={() => handleThemeSelect('dark')}
                  className={`flex-1 aspect-square p-6 border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                    theme === 'dark'
                      ? 'border-primary shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
                  style={{
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-card)',
                  }}
                >
                  <div
                    className="mb-3 flex items-center justify-center"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <div
                      className="relative"
                      style={{ width: '48px', height: '48px' }}
                    >
                      <RiMoonLine
                        size={48}
                        className={`absolute top-0 left-0 transition-all duration-300 ${
                          theme === 'dark'
                            ? 'opacity-0 scale-75'
                            : 'opacity-100 scale-100'
                        }`}
                        style={{ color: 'var(--color-terciary)' }}
                      />
                      <RiMoonFill
                        size={48}
                        className={`absolute top-0 left-0 transition-all duration-300 ${
                          theme === 'dark'
                            ? 'opacity-100 scale-100 icon-bounce'
                            : 'opacity-0 scale-75'
                        }`}
                        style={{ color: 'var(--color-primary)' }}
                      />
                    </div>
                  </div>
                  <h3
                    className="font-semibold text-lg text-center"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Oscuro
                  </h3>
                </button>
              </div>

              {/* Descripción del tema seleccionado */}
              {theme && (
                <div className="mb-6 text-center">
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-terciary)' }}
                  >
                    {theme === 'light'
                      ? 'Tema claro para mayor visibilidad durante el día'
                      : 'Tema oscuro para reducir la fatiga visual'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ThemeSelectionPage;
