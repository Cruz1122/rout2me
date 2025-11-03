import { useEffect, useState } from 'react';
import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import {
  RiUser5Fill,
  RiPencilLine,
  RiNotification3Line,
  RiMoonLine,
  RiShieldCheckLine,
  RiQuestionLine,
  RiFeedbackLine,
  RiLockPasswordLine,
  RiLogoutBoxRLine,
  RiBuilding2Line,
  RiUserAddLine,
  RiBusLine,
  RiTeamLine,
  RiUserUnfollowLine,
  RiMailSendLine,
} from 'react-icons/ri';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getUserInfo,
  formatUserSinceDate,
  getPrimaryOrganization,
  translateOrgRole,
  type UserResponse,
} from '../services/userService';
import R2MLoader from '../../../shared/components/R2MLoader';
import R2MPageHeader from '../../../shared/components/R2MPageHeader';
import R2MProfileButton from '../../../shared/components/R2MProfileButton';
import R2MAvatar from '../../../shared/components/R2MAvatar';
import OrganizationBadge from '../components/OrganizationBadge';

export default function ProfilePage() {
  const router = useIonRouter();
  const { accessToken } = useAuth();
  const [userInfo, setUserInfo] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!accessToken) {
        setError('No hay sesión activa');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getUserInfo(accessToken);
        setUserInfo(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Error al cargar información del usuario';
        setError(errorMessage);
        console.error('Error fetching user info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [accessToken]);

  const handleLogout = () => {
    router.push('/perfil/cerrar-sesion', 'forward');
  };

  const handleChangePassword = () => {
    router.push('/perfil/cambiar-password', 'forward');
  };

  const handleSettingsClick = (setting: string) => {
    // Placeholder para funcionalidad futura
    console.log(`Navegando a configuración: ${setting}`);
  };

  const handleSupportClick = (support: string) => {
    if (support === 'logout') {
      handleLogout();
      return;
    }
    if (support === 'change-password') {
      handleChangePassword();
      return;
    }
    // Placeholder para funcionalidad futura
    console.log(`Navegando a soporte: ${support}`);
  };

  const handleOrganizationClick = (action: string) => {
    // Placeholder para funcionalidad futura
    console.log(`Acción de organización: ${action}`);
  };

  const getRoleBadgeColor = (role: string): string => {
    if (role === 'ADMIN') return '#10B981';
    if (role === 'DRIVER') return '#3B82F6';
    return '#6B7280';
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div className="flex items-center justify-center h-full">
            <R2MLoader />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !userInfo) {
    return (
      <IonPage>
        <IonContent>
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <RiUser5Fill
              size={64}
              style={{ color: 'var(--color-terciary)' }}
              className="mb-4"
            />
            <p
              className="text-lg font-medium"
              style={{ color: 'var(--color-text)' }}
            >
              {error || 'No se pudo cargar la información del usuario'}
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const userName = userInfo.user_metadata?.name || 'Usuario';
  const userEmail = userInfo.email || '';
  const userSince = formatUserSinceDate(userInfo.created_at);
  const avatarUrl =
    userInfo.user_metadata?.avatar_url || userInfo.user_metadata?.picture;
  const organization = getPrimaryOrganization(userInfo);
  const hasOrganization = organization !== null;

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--color-bg)' }}>
        <R2MPageHeader title="Perfil" />
        <div className="px-4 py-2 space-y-3">
          {/* Sección: Información del Usuario */}
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow:
                '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <R2MAvatar
                avatarUrl={avatarUrl}
                userName={userName}
                size={64}
                iconSize={32}
                badge={
                  hasOrganization ? <OrganizationBadge size={20} /> : undefined
                }
              />

              {/* Información del usuario */}
              <div className="flex-1 min-w-0">
                <h2
                  className="text-lg font-semibold mb-1 truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {userName}
                </h2>
                <p
                  className="text-sm mb-1 truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {userEmail}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-terciary)' }}
                >
                  {userSince}
                </p>
              </div>

              {/* Botón de editar */}
              <button
                onClick={() => handleSettingsClick('edit')}
                className="flex-shrink-0 p-2 rounded-lg transition-colors"
                style={{
                  color: 'var(--color-terciary)',
                }}
                aria-label="Editar perfil"
              >
                <RiPencilLine size={20} />
              </button>
            </div>
          </div>

          {/* Sección: Organización */}
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow:
                '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <p
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Organización
            </p>

            {hasOrganization ? (
              <div className="space-y-2">
                {/* Con organización */}
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                  {/* Badge de la organización */}
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                    }}
                  >
                    <RiBuilding2Line size={16} />
                    <span className="text-sm font-medium">
                      {organization.company_name}
                    </span>
                  </div>

                  {/* Badge del rol */}
                  <div
                    className="inline-flex items-center px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: getRoleBadgeColor(organization.org_role),
                      color: '#FFFFFF',
                    }}
                  >
                    <span className="text-sm font-medium">
                      {translateOrgRole(organization.org_role)}
                    </span>
                  </div>
                </div>

                {/* Opciones según el rol */}
                {organization.org_role === 'USER' && (
                  <>
                    <R2MProfileButton
                      icon={<RiMailSendLine size={20} />}
                      title="Solicitar permisos"
                      description="Solicitar nuevo rol al administrador"
                      onClick={() => handleOrganizationClick('request-role')}
                    />
                    <R2MProfileButton
                      icon={<RiUserUnfollowLine size={20} />}
                      title="Abandonar organización"
                      onClick={() => handleOrganizationClick('leave')}
                      variant="danger"
                    />
                  </>
                )}

                {organization.org_role === 'DRIVER' && (
                  <>
                    <R2MProfileButton
                      icon={<RiBusLine size={20} />}
                      title="Gestionar buses"
                      description="Administrar tus vehículos asignados"
                      onClick={() => handleOrganizationClick('manage-buses')}
                    />
                    <R2MProfileButton
                      icon={<RiUserUnfollowLine size={20} />}
                      title="Abandonar organización"
                      onClick={() => handleOrganizationClick('leave')}
                      variant="danger"
                    />
                  </>
                )}

                {organization.org_role === 'ADMIN' && (
                  <>
                    <R2MProfileButton
                      icon={<RiTeamLine size={20} />}
                      title="Gestionar miembros"
                      description="Administrar usuarios de la organización"
                      onClick={() => handleOrganizationClick('manage-members')}
                    />
                    <R2MProfileButton
                      icon={<RiUserUnfollowLine size={20} />}
                      title="Abandonar organización"
                      onClick={() => handleOrganizationClick('leave')}
                      variant="danger"
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Sin organización */}
                <p
                  className="text-sm mb-2"
                  style={{ color: 'var(--color-terciary)' }}
                >
                  No perteneces a ninguna organización
                </p>
                <R2MProfileButton
                  icon={<RiUserAddLine size={20} />}
                  title="Unirse a una organización"
                  description="Ingresa el código de la organización"
                  onClick={() => handleOrganizationClick('join')}
                />
              </div>
            )}
          </div>

          {/* Sección: Configuración */}
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow:
                '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <p
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Configuración
            </p>

            <div className="space-y-2">
              {/* Notificaciones */}
              <R2MProfileButton
                icon={<RiNotification3Line size={20} />}
                title="Notificaciones"
                description="Gestionar alertas y avisos"
                onClick={() => handleSettingsClick('notifications')}
              />

              {/* Tema */}
              <R2MProfileButton
                icon={<RiMoonLine size={20} />}
                title="Tema"
                description="Cambiar entre claro y oscuro"
                onClick={() => handleSettingsClick('theme')}
              />

              {/* Privacidad */}
              <R2MProfileButton
                icon={<RiShieldCheckLine size={20} />}
                title="Privacidad"
                description="Configurar permisos y datos"
                onClick={() => handleSettingsClick('privacy')}
              />
            </div>
          </div>

          {/* Sección: Soporte */}
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow:
                '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <p
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Soporte
            </p>

            <div className="space-y-2">
              {/* Centro de ayuda */}
              <R2MProfileButton
                icon={<RiQuestionLine size={20} />}
                title="Centro de ayuda"
                onClick={() => handleSupportClick('help')}
              />

              {/* Enviar comentarios */}
              <R2MProfileButton
                icon={<RiFeedbackLine size={20} />}
                title="Enviar comentarios"
                onClick={() => handleSupportClick('feedback')}
              />

              {/* Cambiar contraseña */}
              <R2MProfileButton
                icon={<RiLockPasswordLine size={20} />}
                title="Cambiar contraseña"
                onClick={() => handleSupportClick('change-password')}
              />

              {/* Cerrar sesión */}
              <R2MProfileButton
                icon={<RiLogoutBoxRLine size={20} />}
                title="Cerrar sesión"
                onClick={() => handleSupportClick('logout')}
                variant="danger"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
