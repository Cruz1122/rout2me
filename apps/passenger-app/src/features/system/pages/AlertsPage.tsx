import { IonContent, IonPage } from '@ionic/react';
import { RiNotificationFill } from 'react-icons/ri';

export default function AlertsPage() {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1
            className="text-3xl font-bold text-center mb-12"
            style={{ color: 'var(--ion-color-dark)' }}
          >
            Alertas
          </h1>
          <div className="mb-8">
            <RiNotificationFill
              size={120}
              style={{ color: 'var(--color-primary)' }}
            />
          </div>
          <p className="text-lg text-gray-600 font-medium">
            Funcionalidad en desarrollo
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
