import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
export default function RoutesPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Rutas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>Favoritas / recientes / tarifas</IonContent>
    </IonPage>
  );
}
