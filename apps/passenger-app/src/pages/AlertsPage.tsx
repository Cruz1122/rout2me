import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
export default function AlertsPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Alertas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>Alarmas y avisos</IonContent>
    </IonPage>
  );
}
