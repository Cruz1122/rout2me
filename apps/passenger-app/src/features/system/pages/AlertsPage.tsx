import { IonContent, IonPage } from '@ionic/react';
import { RiNotificationFill } from 'react-icons/ri';

export default function AlertsPage() {
  return (
    <IonPage>
      <IonContent
        className="ion-padding"
        style={{ '--background': 'var(--color-bg)' }}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1
            className="text-3xl font-bold text-center mb-12"
            style={{ color: 'var(--color-text)' }}
          >
            Alertas
          </h1>
          <div className="mb-8">
            <RiNotificationFill
              size={120}
              style={{ color: 'var(--color-primary)' }}
            />
          </div>
          <p
            className="text-lg font-medium"
            style={{ color: 'var(--color-terciary)' }}
          >
            Funcionalidad en desarrollo
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
