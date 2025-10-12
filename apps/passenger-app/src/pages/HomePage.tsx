import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
export default function HomePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Inicio</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>Mapa inicial</IonContent>
    </IonPage>
  );
}
