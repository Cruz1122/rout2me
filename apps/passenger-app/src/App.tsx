import {
  IonApp,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
} from '@ionic/react';
import {
  APP_NAME,
  calculateDistance,
  formatCoordinate,
  success,
  error,
  isSuccess,
} from '@rout2me/shared';
import type { LatLng, VehiclePing, Result } from '@rout2me/shared';

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
  // Demo vehicle pings using new types
  const vehiclePings: VehiclePing[] = [
    {
      id: 'bus-001',
      ts: new Date().toISOString(),
      pos: { lat: -12.0464, lng: -77.0428 },
      speed: 45,
    },
    {
      id: 'bus-002',
      ts: new Date().toISOString(),
      pos: { lat: -12.05, lng: -77.04 },
      speed: 32,
    },
  ];

  const userLocation: LatLng = { lat: -12.048, lng: -77.042 };

  // Calculate distances using shared utilities
  const nearestBus = vehiclePings.reduce((nearest, ping) => {
    const distance = calculateDistance(userLocation, ping.pos);
    const nearestDistance = calculateDistance(userLocation, nearest.pos);
    return distance < nearestDistance ? ping : nearest;
  }, vehiclePings[0]);

  const distanceToNearest = calculateDistance(userLocation, nearestBus.pos);

  // Demo Result type usage
  const findBusResult: Result<VehiclePing> =
    distanceToNearest < 2
      ? success(nearestBus)
      : error('No buses found nearby');

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{APP_NAME} - Passenger App</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome to {APP_NAME}</h1>

        <div className="location-info">
          <h2>Your Location</h2>
          <p>{formatCoordinate(userLocation)}</p>
        </div>

        <div className="bus-search">
          <h2>Nearest Bus</h2>
          {isSuccess(findBusResult) ? (
            <div>
              <p>Bus {findBusResult.data.id} found!</p>
              <p>Location: {formatCoordinate(findBusResult.data.pos)}</p>
              <p>Distance: {distanceToNearest.toFixed(2)} km</p>
              <p>Speed: {findBusResult.data.speed} km/h</p>
            </div>
          ) : (
            <p>Error: {findBusResult.error}</p>
          )}
        </div>

        <IonButton expand="block" color="primary">
          Track Bus
        </IonButton>
      </IonContent>
    </IonApp>
  );
}

export default App;
