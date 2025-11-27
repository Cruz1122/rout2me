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
import RecoveryRedirect from './features/auth/components/RecoveryRedirect';
import { useActiveTab } from './features/system/hooks/useActiveTab';
import OAuthHandler from './features/auth/components/OAuthHandler';
import { ThemeProvider } from './contexts/ThemeContext';
import BackButtonHandler from './features/system/components/BackButtonHandler';

const HomePage = lazy(() => import('./features/system/pages/HomePage'));
const RoutesPage = lazy(() => import('./features/routes/pages/RoutesPage'));
const BusesPage = lazy(() => import('./features/routes/pages/BusesPage'));
const AlertsPage = lazy(() => import('./features/system/pages/AlertsPage'));
const ProfilePage = lazy(() => import('./features/user/pages/ProfilePage'));
const LogoutConfirmationPage = lazy(
  () => import('./features/user/pages/LogoutConfirmationPage'),
);
const LeaveOrganizationConfirmationPage = lazy(
  () => import('./features/user/pages/LeaveOrganizationConfirmationPage'),
);
const JoinOrganizationPage = lazy(
  () => import('./features/user/pages/JoinOrganizationPage'),
);
const ChangePasswordPage = lazy(
  () => import('./features/user/pages/ChangePasswordPage'),
);
const EditProfilePage = lazy(
  () => import('./features/user/pages/EditProfilePage'),
);
const ThemeSelectionPage = lazy(
  () => import('./features/user/pages/ThemeSelectionPage'),
);
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'));
const TwoFAPage = lazy(() => import('./features/auth/pages/TwoFAPage'));
const ForgotPasswordPage = lazy(
  () => import('./features/auth/pages/ForgotPasswordPage'),
);
const ResetPasswordPage = lazy(
  () => import('./features/auth/pages/ResetPasswordPage'),
);
const ExpiredLinkPage = lazy(
  () => import('./features/auth/pages/ExpiredLinkPage'),
);
const ConfirmAccountPage = lazy(
  () => import('./features/auth/pages/ConfirmAccountPage'),
);
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
          <Route exact path="/buses">
            <Suspense fallback={<GlobalLoader />}>
              <BusesPage />
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
          <Route exact path="/perfil/cambiar-password">
            <Suspense fallback={<GlobalLoader />}>
              <ChangePasswordPage />
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
          <IonTabButton tab="buses" href="/buses">
            <AnimatedTabIcon iconName="bus" isActive={activeTab === 'buses'} />
            <IonLabel>Buses</IonLabel>
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
    <ThemeProvider>
      <IonApp>
        <IonReactRouter>
          <BackButtonHandler />
          <OAuthHandler />
          <RecoveryRedirect />
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
            <Route exact path="/forgot-password">
              <Suspense fallback={<GlobalLoader />}>
                <ForgotPasswordPage />
              </Suspense>
            </Route>
            <Route exact path="/reset-password">
              <Suspense fallback={<GlobalLoader />}>
                <ResetPasswordPage />
              </Suspense>
            </Route>
            <Route exact path="/expired-link">
              <Suspense fallback={<GlobalLoader />}>
                <ExpiredLinkPage />
              </Suspense>
            </Route>
            <Route exact path="/auth/confirm">
              <Suspense fallback={<GlobalLoader />}>
                <ConfirmAccountPage />
              </Suspense>
            </Route>
            <Route exact path="/perfil/cerrar-sesion">
              <Suspense fallback={<GlobalLoader />}>
                <LogoutConfirmationPage />
              </Suspense>
            </Route>
            <Route exact path="/perfil/abandonar-organizacion">
              <Suspense fallback={<GlobalLoader />}>
                <LeaveOrganizationConfirmationPage />
              </Suspense>
            </Route>
            <Route exact path="/perfil/unirse-organizacion">
              <Suspense fallback={<GlobalLoader />}>
                <JoinOrganizationPage />
              </Suspense>
            </Route>
            <Route exact path="/perfil/editar">
              <Suspense fallback={<GlobalLoader />}>
                <EditProfilePage />
              </Suspense>
            </Route>
            <Route exact path="/perfil/tema">
              <Suspense fallback={<GlobalLoader />}>
                <ThemeSelectionPage />
              </Suspense>
            </Route>
            <Route
              exact
              path="/"
              render={() => {
                // Verificar si hay un hash de recuperación o error
                const hash = globalThis.location.hash;
                if (hash) {
                  const params = new URLSearchParams(hash.substring(1));
                  const type = params.get('type');
                  const error = params.get('error');
                  const errorCode = params.get('error_code');

                  // Si hay un error de token expirado
                  if (
                    error === 'access_denied' &&
                    errorCode === 'otp_expired'
                  ) {
                    console.log(
                      '❌ Token expirado detectado, redirigiendo a /expired-link',
                    );
                    return <Redirect to="/expired-link" />;
                  }

                  // Si es un enlace de recuperación válido
                  if (type === 'recovery') {
                    console.log(
                      '🔐 Recuperación detectada en raíz, redirigiendo a /reset-password con hash',
                    );
                    // Preservar el hash en la redirección
                    return <Redirect to={`/reset-password${hash}`} />;
                  }
                }
                return <Redirect to="/location-permission" />;
              }}
            />
            <Route>
              <TabsWithIcons />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </ThemeProvider>
  );
}
