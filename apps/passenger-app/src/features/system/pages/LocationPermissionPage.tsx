import { useEffect, useState } from 'react';
import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import { RiMapPinLine } from 'react-icons/ri';
import { useLocationPermission } from '../hooks/useLocationPermission';

export default function LocationPermissionPage() {
  const router = useIonRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const { hasPermission, isChecking } = useLocationPermission();

  // Redirigir a welcome si ya tiene permisos
  useEffect(() => {
    if (!isChecking && hasPermission) {
      router.push('/welcome', 'forward', 'replace');
    }
  }, [hasPermission, isChecking, router]);

  const handleRequestPermission = () => {
    setIsRequesting(true);

    navigator.geolocation.getCurrentPosition(
      () => {
        console.log('Permiso de ubicación otorgado');
        router.push('/welcome', 'forward', 'replace');
      },
      (error) => {
        console.error('Error al solicitar ubicación:', error);
        setIsRequesting(false);

        if (error.code === 1) {
          alert(
            'Por favor, permite el acceso a tu ubicación en la configuración de tu navegador para usar la aplicación.',
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          {/* Icono grande */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2rem',
              boxShadow: `0 8px 24px rgba(var(--color-primary-rgb), 0.25)`,
            }}
          >
            <RiMapPinLine size={64} color="var(--color-on-primary)" />
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: 'var(--color-primary)',
            }}
          >
            Activa tu ubicación
          </h1>

          {/* Descripción */}
          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--color-terciary)',
              marginBottom: '2rem',
              lineHeight: '1.6',
              maxWidth: '400px',
            }}
          >
            Para disfrutar de Rout2Me, necesitamos acceso a tu ubicación.
          </p>

          {/* Botón de acción */}
          {!isChecking && hasPermission === false && !isRequesting && (
            <button
              onClick={handleRequestPermission}
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--color-on-primary)',
                backgroundColor: 'var(--color-primary)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: `0 4px 12px rgba(var(--color-primary-rgb), 0.3)`,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 16px rgba(var(--color-primary-rgb), 0.4)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px rgba(var(--color-primary-rgb), 0.3)`;
              }}
            >
              Activar ubicación
            </button>
          )}

          {(isChecking || isRequesting) && (
            <div
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--color-primary)',
              }}
            >
              {isChecking
                ? 'Verificando permisos...'
                : 'Solicitando permiso...'}
            </div>
          )}

          {/* Nota de privacidad */}
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-gray-500)',
              marginTop: '2rem',
              maxWidth: '350px',
            }}
          >
            Tu ubicación es privada y segura. Solo la usamos para mejorar tu
            experiencia en la aplicación.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
