import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { colorClasses } from '../styles/colors';
import './R2MSidebar.css';
import {
  RiDashboardLine,
  RiMapPinLine,
  RiBusFill,
  RiRoadMapLine,
  RiAlertLine,
  RiCalendar2Line,
  RiBarChartBoxLine,
  RiGroupLine,
  RiLogoutBoxRLine,
  RiUserLine,
} from 'react-icons/ri';
import R2MModal from './R2MModal';
import R2MButton from './R2MButton';

export default function R2MSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const confirmLogout = () => {
    clearAuth();
    setShowLogoutModal(false);
    navigate('/signin');
  };

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/home',
      icon: RiDashboardLine,
    },
    {
      label: 'Flota en Vivo',
      path: '/live-fleet',
      icon: RiMapPinLine,
    },
    {
      label: 'Vehículos',
      path: '/vehicles',
      icon: RiBusFill,
    },
    {
      label: 'Rutas',
      path: '/routes',
      icon: RiRoadMapLine,
    },
    {
      label: 'Incidentes',
      path: '/incidents',
      icon: RiAlertLine,
      disabled: true,
    },
    {
      label: 'Disponibilidad',
      path: '/availability',
      icon: RiCalendar2Line,
      disabled: true,
    },
    {
      label: 'Reportes',
      path: '/reports',
      icon: RiBarChartBoxLine,
      disabled: true,
    },
    {
      label: 'Usuarios',
      path: '/users',
      icon: RiGroupLine,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div
        className={`r2m-sidebar ${isHovered ? '' : 'r2m-sidebar--collapsed'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="r2m-sidebar__content">
          {/* Perfil de Usuario */}
          <div className="r2m-sidebar__user">
            <div className="r2m-sidebar__user-avatar">
              <RiUserLine size={16} />
            </div>
            {isHovered && (
              <div className="r2m-sidebar__user-info">
                <p className="r2m-sidebar__user-name">
                  {user?.name || 'Usuario'}
                </p>
                <p className="r2m-sidebar__user-email">{user?.email || ''}</p>
              </div>
            )}
          </div>

          {/* Menú de Navegación */}
          <nav className="r2m-sidebar__nav">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const disabled = item.disabled;
              const IconComponent = item.icon;

              const content = (
                <div
                  className={`r2m-sidebar__nav-item ${active ? 'r2m-sidebar__nav-item--active' : ''} ${disabled ? 'r2m-sidebar__nav-item--disabled' : ''}`}
                  title={isHovered ? undefined : item.label}
                >
                  <div className="r2m-sidebar__nav-icon">
                    <IconComponent size={24} />
                  </div>
                  {isHovered && (
                    <span className="r2m-sidebar__nav-label">{item.label}</span>
                  )}
                </div>
              );

              if (disabled) {
                return <div key={item.path}>{content}</div>;
              }

              return (
                <Link key={item.path} to={item.path}>
                  {content}
                </Link>
              );
            })}
          </nav>

          {/* Botón Cerrar Sesión */}
          <div className="r2m-sidebar__footer">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="r2m-sidebar__logout"
              title={isHovered ? undefined : 'Cerrar sesión'}
            >
              <div className="r2m-sidebar__nav-icon">
                <RiLogoutBoxRLine size={24} />
              </div>
              {isHovered && (
                <span className="r2m-sidebar__nav-label">Cerrar Sesión</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Logout */}
      <R2MModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Cerrar Sesión"
        maxWidth="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <R2MButton
              onClick={() => setShowLogoutModal(false)}
              variant="ghost"
              size="md"
            >
              Cancelar
            </R2MButton>
            <R2MButton
              onClick={confirmLogout}
              variant="danger"
              size="md"
              icon="ri-logout-box-r-line"
              iconPosition="left"
            >
              Cerrar Sesión
            </R2MButton>
          </div>
        }
      >
        <p className={colorClasses.textTerciary}>
          ¿Estás seguro de que deseas cerrar sesión?
        </p>
      </R2MModal>
    </>
  );
}
