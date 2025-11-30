import { useState, useEffect } from 'react';
import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import R2MButton from '../../../shared/components/R2MButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { RiRouteLine, RiBus2Line, RiRoadMapLine } from 'react-icons/ri';

interface Stage {
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }> | null;
  message: string;
}

const STAGES: Stage[] = [
  {
    icon: null,
    message: 'Tu sistema de transporte público inteligente',
  },
  {
    icon: RiRouteLine,
    message: 'Explora todas las rutas disponibles',
  },
  {
    icon: RiBus2Line,
    message: 'Rastrea buses en tiempo real',
  },
  {
    icon: RiRoadMapLine,
    message: 'Visualiza todo en un mapa interactivo',
  },
];

export default function WelcomePage() {
  const router = useIonRouter();
  const { theme } = useTheme();
  const [currentStage, setCurrentStage] = useState(0);

  const handleNext = () => {
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(currentStage + 1);
    } else {
      router.push('/login', 'forward');
    }
  };

  const handlePrevious = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleSkip = () => {
    router.push('/login', 'forward');
  };

  const currentStageData = STAGES[currentStage];
  const IconComponent = currentStageData.icon;
  const isFirstStage = currentStage === 0;
  const isLastStage = currentStage === STAGES.length - 1;
  const showIcon = IconComponent !== null && !isFirstStage;

  // Quitar el focus de cualquier botón cuando cambia la etapa
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [currentStage]);

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="flex flex-col items-center justify-center min-h-full px-6">
          {/* Indicadores de progreso (dots) - fijo arriba */}
          <div className="fixed top-8 left-0 right-0 flex justify-center z-10 pt-4">
            <div className="flex gap-2">
              {STAGES.map((_, index) => (
                <div
                  key={index}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: index === currentStage ? '24px' : '8px',
                    height: '8px',
                    backgroundColor:
                      index === currentStage
                        ? 'var(--color-primary)'
                        : 'var(--color-terciary)',
                    opacity: index === currentStage ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Contenido principal centrado */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
            {/* Título Rout2Me */}
            <h1
              className="font-bold"
              style={{
                color: 'var(--color-primary)',
                fontSize: isFirstStage ? '56px' : '32px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                transition: 'font-size 0.3s ease',
                marginBottom: '48px',
              }}
            >
              Rout2Me
            </h1>

            {/* Icono - mostrar logo en primera etapa o icono de feature en otras */}
            {isFirstStage ? (
              <div style={{ marginBottom: '48px' }}>
                <img
                  src={
                    theme === 'light'
                      ? '/icon-metadata-blue.webp'
                      : '/icon-metadata.webp'
                  }
                  alt="Rout2Me"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            ) : (
              showIcon &&
              IconComponent && (
                <div style={{ marginBottom: '48px' }}>
                  <IconComponent
                    className="transition-all duration-300"
                    style={{
                      fontSize: '120px',
                      color: 'var(--color-primary)',
                    }}
                  />
                </div>
              )
            )}

            {/* Mensaje descriptivo */}
            <p
              className="text-center px-4"
              style={{
                color: 'var(--color-terciary)',
                fontSize: '16px',
                lineHeight: '1.6',
                maxWidth: '320px',
                marginBottom: '48px',
              }}
            >
              {currentStageData.message}
            </p>
          </div>

          {/* Botones de navegación */}
          <div className="flex-shrink-0 w-full max-w-md mx-auto pb-4">
            <div className="flex gap-4 items-stretch justify-center">
              {!isFirstStage && (
                <R2MButton
                  key={`prev-${currentStage}`}
                  variant="outline"
                  size="large"
                  onClick={handlePrevious}
                  style={{ width: '160px' }}
                >
                  Anterior
                </R2MButton>
              )}
              <R2MButton
                key={`next-${currentStage}`}
                variant="primary"
                size="large"
                fullWidth={isFirstStage}
                onClick={handleNext}
                style={!isFirstStage ? { width: '160px' } : undefined}
              >
                {isLastStage ? 'Comenzar' : 'Siguiente'}
              </R2MButton>
            </div>
          </div>

          {/* Botón Omitir */}
          <div className="w-full max-w-md flex justify-center pb-8">
            <button
              onClick={handleSkip}
              className="text-sm font-medium"
              style={{ color: 'var(--color-terciary)' }}
            >
              Omitir
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
