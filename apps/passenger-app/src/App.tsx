import { lazy, Suspense } from 'react';
import {
  IonApp,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import AnimatedTabIcon from './shared/components/AnimatedTabIcon';
import GlobalLoader from './features/system/components/GlobalLoader';
import RouteGuard from './components/RouteGuard';
import { useActiveTab } from './features/system/hooks/useActiveTab';

const HomePage = lazy(() => import('./features/system/pages/HomePage'));
const RoutesPage = lazy(() => import('./features/routes/pages/RoutesPage'));
const LivePage = lazy(() => import('./features/routes/pages/LivePage'));
const AlertsPage = lazy(() => import('./features/system/pages/AlertsPage'));
const ProfilePage = lazy(() => import('./features/user/pages/ProfilePage'));
const LogoutConfirmationPage = lazy(
  () => import('./features/user/pages/LogoutConfirmationPage'),
);
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'));
const TwoFAPage = lazy(() => import('./features/auth/pages/TwoFAPage'));
const LocationPermissionPage = lazy(
  () => import('./features/system/pages/LocationPermissionPage'),
);
const WelcomePage = lazy(() => import('./features/system/pages/WelcomePage'));

function TabsWithIcons() {
  const activeTab = useActiveTab();

  return (
    <RouteGuard>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/inicio">
            <Suspense fallback={<GlobalLoader />}>
              <HomePage />
            </Suspense>
          </Route>
          <Route exact path="/rutas">
            <Suspense fallback={<GlobalLoader />}>
              <RoutesPage />
            </Suspense>
          </Route>
          <Route exact path="/en-vivo">
            <Suspense fallback={<GlobalLoader />}>
              <LivePage />
            </Suspense>
          </Route>
          <Route exact path="/alertas">
            <Suspense fallback={<GlobalLoader />}>
              <AlertsPage />
            </Suspense>
          </Route>
          <Route exact path="/perfil">
            <Suspense fallback={<GlobalLoader />}>
              <ProfilePage />
            </Suspense>
          </Route>
          <Route exact path="/">
            <Redirect to="/inicio" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="inicio" href="/inicio">
            <AnimatedTabIcon
              iconName="home"
              isActive={activeTab === 'inicio'}
            />
            <IonLabel>Inicio</IonLabel>
          </IonTabButton>
          <IonTabButton tab="rutas" href="/rutas">
            <AnimatedTabIcon
              iconName="route"
              isActive={activeTab === 'rutas'}
            />
            <IonLabel>Rutas</IonLabel>
          </IonTabButton>
          <IonTabButton tab="en-vivo" href="/en-vivo">
            <AnimatedTabIcon
              iconName="bus"
              isActive={activeTab === 'en-vivo'}
            />
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
            <AnimatedTabIcon
              iconName="user"
              isActive={activeTab === 'perfil'}
            />
            <IonLabel>Perfil</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </RouteGuard>
  );
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/location-permission">
            <Suspense fallback={<GlobalLoader />}>
              <LocationPermissionPage />
            </Suspense>
          </Route>
          <Route exact path="/welcome">
            <Suspense fallback={<GlobalLoader />}>
              <WelcomePage />
            </Suspense>
          </Route>
          <Route exact path="/login">
            <Suspense fallback={<GlobalLoader />}>
              <LoginPage />
            </Suspense>
          </Route>
          <Route exact path="/register">
            <Suspense fallback={<GlobalLoader />}>
              <RegisterPage />
            </Suspense>
          </Route>
          <Route exact path="/2fa">
            <Suspense fallback={<GlobalLoader />}>
              <TwoFAPage />
            </Suspense>
          </Route>
          <Route exact path="/perfil/cerrar-sesion">
            <Suspense fallback={<GlobalLoader />}>
              <LogoutConfirmationPage />
            </Suspense>
          </Route>
          <Route exact path="/">
            <Redirect to="/location-permission" />
          </Route>
          <Route>
            <TabsWithIcons />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
