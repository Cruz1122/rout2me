import { lazy, Suspense } from 'react';
import {
  IonApp,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonSpinner,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import AnimatedTabIcon from './components/AnimatedTabIcon';
import { useActiveTab } from './hooks/useActiveTab';

const HomePage = lazy(() => import('./pages/HomePage'));
const RoutesPage = lazy(() => import('./pages/RoutesPage'));
const LivePage = lazy(() => import('./pages/LivePage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function TabsWithIcons() {
  const activeTab = useActiveTab();

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Suspense
          fallback={
            <div
              className="ion-padding"
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <IonSpinner name="crescent" />
            </div>
          }
        >
          <Route exact path="/inicio" component={HomePage} />
          <Route exact path="/rutas" component={RoutesPage} />
          <Route exact path="/en-vivo" component={LivePage} />
          <Route exact path="/alertas" component={AlertsPage} />
          <Route exact path="/perfil" component={ProfilePage} />
          <Route exact path="/" render={() => <Redirect to="/inicio" />} />
        </Suspense>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="inicio" href="/inicio">
          <AnimatedTabIcon iconName="home" isActive={activeTab === 'inicio'} />
          <IonLabel>Inicio</IonLabel>
        </IonTabButton>
        <IonTabButton tab="rutas" href="/rutas">
          <AnimatedTabIcon iconName="route" isActive={activeTab === 'rutas'} />
          <IonLabel>Rutas</IonLabel>
        </IonTabButton>
        <IonTabButton tab="en-vivo" href="/en-vivo">
          <AnimatedTabIcon iconName="bus" isActive={activeTab === 'en-vivo'} />
          <IonLabel>En vivo</IonLabel>
        </IonTabButton>
        <IonTabButton tab="alertas" href="/alertas">
          <AnimatedTabIcon
            iconName="notification"
            isActive={activeTab === 'alertas'}
          />
          <IonLabel>Alertas</IonLabel>
        </IonTabButton>
        <IonTabButton tab="perfil" href="/perfil">
          <AnimatedTabIcon iconName="user" isActive={activeTab === 'perfil'} />
          <IonLabel>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <TabsWithIcons />
      </IonReactRouter>
    </IonApp>
  );
}
