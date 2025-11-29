import { lazy } from 'react';
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
import SafeSuspense from './shared/components/SafeSuspense';
import RouteGuard from './components/RouteGuard';
import RecoveryRedirect from './features/auth/components/RecoveryRedirect';
import { useActiveTab } from './features/system/hooks/useActiveTab';
import OAuthHandler from './features/auth/components/OAuthHandler';
import { ThemeProvider } from './contexts/ThemeContext';
import BackButtonHandler from './features/system/components/BackButtonHandler';

const HomePage = lazy(() => import('./features/system/pages/HomePage'));
const RoutesPage = lazy(() => import('./features/routes/pages/RoutesPage'));
const BusesPage = lazy(() => import('./features/routes/pages/BusesPage'));
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
            <SafeSuspense fallback={<GlobalLoader />}>
              <HomePage />
            </SafeSuspense>
          </Route>
          <Route exact path="/rutas">
            <SafeSuspense fallback={<GlobalLoader />}>
              <RoutesPage />
            </SafeSuspense>
          </Route>
          <Route exact path="/buses">
            <SafeSuspense fallback={<GlobalLoader />}>
              <BusesPage />
            </SafeSuspense>
          </Route>
          <Route exact path="/perfil">
            <SafeSuspense fallback={<GlobalLoader />}>
              <ProfilePage />
            </SafeSuspense>
          </Route>
          <Route exact path="/perfil/cambiar-password">
            <SafeSuspense fallback={<GlobalLoader />}>
              <ChangePasswordPage />
            </SafeSuspense>
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
              <SafeSuspense fallback={<GlobalLoader />}>
                <LocationPermissionPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/welcome">
              <SafeSuspense fallback={<GlobalLoader />}>
                <WelcomePage />
              </SafeSuspense>
            </Route>
            <Route exact path="/login">
              <SafeSuspense fallback={<GlobalLoader />}>
                <LoginPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/register">
              <SafeSuspense fallback={<GlobalLoader />}>
                <RegisterPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/2fa">
              <SafeSuspense fallback={<GlobalLoader />}>
                <TwoFAPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/forgot-password">
              <SafeSuspense fallback={<GlobalLoader />}>
                <ForgotPasswordPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/reset-password">
              <SafeSuspense fallback={<GlobalLoader />}>
                <ResetPasswordPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/expired-link">
              <SafeSuspense fallback={<GlobalLoader />}>
                <ExpiredLinkPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/auth/confirm">
              <SafeSuspense fallback={<GlobalLoader />}>
                <ConfirmAccountPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/perfil/cerrar-sesion">
              <SafeSuspense fallback={<GlobalLoader />}>
                <LogoutConfirmationPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/perfil/abandonar-organizacion">
              <SafeSuspense fallback={<GlobalLoader />}>
                <LeaveOrganizationConfirmationPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/perfil/unirse-organizacion">
              <SafeSuspense fallback={<GlobalLoader />}>
                <JoinOrganizationPage />
              </SafeSuspense>
            </Route>
            <Route exact path="/perfil/editar">
              <SafeSuspense fallback={<GlobalLoader />}>
                <EditProfilePage />
              </SafeSuspense>
            </Route>
            <Route exact path="/perfil/tema">
              <SafeSuspense fallback={<GlobalLoader />}>
                <ThemeSelectionPage />
              </SafeSuspense>
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
