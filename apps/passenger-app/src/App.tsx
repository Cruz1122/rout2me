import {
  IonApp,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { APP_NAME } from '@rout2me/shared';

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

/* App styles */
import './App.css';

function App() {
  return (
    <IonApp>
      <IonContent className="ion-padding">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 200px)',
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '500px',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              marginBottom: '1rem',
              fontSize: '2.5rem',
              fontWeight: '800',
            }}
          >
            Passenger App
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#888',
              marginBottom: '2rem',
              lineHeight: '1.5',
            }}
          >
            Aplicación móvil para que los pasajeros puedan rastrear buses en
            tiempo real
          </p>

          <div
            style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '1.5rem',
              width: '100%',
            }}
          >
            <p style={{ margin: 0, color: '#000', fontSize: '0.9rem' }}>
              Listo para desarrollo
            </p>
          </div>
        </div>
      </IonContent>
    </IonApp>
  );
}

export default App;
