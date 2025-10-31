import {
  IonContent,
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { RiUser5Fill } from 'react-icons/ri';

export default function ProfilePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1
            className="text-3xl font-bold text-center mb-12"
            style={{ color: 'var(--ion-color-dark)' }}
          >
            Perfil
          </h1>
          <div className="mb-8">
            <RiUser5Fill size={120} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-lg text-gray-600 font-medium mb-8">
            Funcionalidad en desarrollo
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
}
