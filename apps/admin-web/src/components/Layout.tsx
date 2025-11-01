import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Rutas que no deben mostrar navbar/sidebar (auth pages)
  const authRoutes = ['/signin', '/signup', '/email-verified', '/'];
  const isAuthRoute = authRoutes.includes(location.pathname);

  // Rutas que usan sidebar (Dashboard)
  const sidebarRoutes = ['/home'];
  const useSidebar = sidebarRoutes.includes(location.pathname);

  // Rutas que usan navbar horizontal (otras páginas protegidas)
  const navbarRoutes = [
    '/vehicles',
    '/fleet',
    '/live-fleet',
    '/routes',
    '/incidents',
    '/availability',
    '/reports',
    '/users',
  ];
  const useNavbar = navbarRoutes.includes(location.pathname);

  // Si es una ruta de autenticación, solo renderizar children sin layout
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Si usa sidebar (Dashboard)
  if (useSidebar) {
    return (
      <div
        className="relative flex h-auto min-h-screen w-full flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow">
          <Sidebar />
          <div className="flex flex-1 ml-80">
            <div className="layout-content-container flex flex-col flex-1 px-6 py-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si usa navbar horizontal (Vehicles y otras páginas)
  if (useNavbar) {
    return (
      <div
        className="relative flex h-auto min-h-screen w-full flex-col bg-white group/design-root overflow-x-hidden"
        style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col">
          <Navbar />
          {children}
        </div>
      </div>
    );
  }

  // Fallback: renderizar sin layout
  return <>{children}</>;
}
