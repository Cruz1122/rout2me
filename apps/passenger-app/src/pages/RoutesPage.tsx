import { IonContent, IonPage } from '@ionic/react';
import { RiRouteFill } from 'react-icons/ri';

export default function RoutesPage() {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1
            className="text-3xl font-bold text-center mb-12"
            style={{ color: 'var(--ion-color-dark)' }}
          >
            Rutas
          </h1>
          <div className="mb-8">
            <RiRouteFill size={120} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-lg text-gray-600 font-medium">
            Funcionalidad en desarrollo
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
