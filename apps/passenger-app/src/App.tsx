import {
  IonApp,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
} from '@ionic/react';
import { APP_NAME, BusLocation } from '@rout2me/shared';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

function App() {
  const currentLocation: BusLocation = {
    id: 'bus-001',
    latitude: -12.0464,
    longitude: -77.0428,
    timestamp: new Date(),
  };

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{APP_NAME} - Passenger App</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome to {APP_NAME}</h1>
        <p>
          Current Bus Location: {currentLocation.latitude},{' '}
          {currentLocation.longitude}
        </p>
        <IonButton expand="block" color="primary">
          Find My Bus
        </IonButton>
      </IonContent>
    </IonApp>
  );
}

export default App;
