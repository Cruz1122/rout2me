import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
export default function LivePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>En vivo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>Buses cerca</IonContent>
    </IonPage>
  );
}
