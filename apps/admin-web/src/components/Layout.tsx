import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import R2MSidebar from './R2MSidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: Readonly<LayoutProps>) {
  const location = useLocation();

  // Rutas que no deben mostrar sidebar (auth pages)
  const authRoutes = [
    '/signin',
    '/signup',
    '/email-verified',
    '/forgot-password',
    '/reset-password',
    '/verify-recovery',
    '/auth/confirm',
    '/',
  ];
  const isAuthRoute = authRoutes.includes(location.pathname);

  // Si es una ruta de autenticación, solo renderizar children sin layout
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Todas las páginas protegidas usan el sidebar
  return (
    <div
      className="relative flex h-auto min-h-screen w-full bg-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <R2MSidebar />
      <div
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: '80px' }}
      >
        {children}
      </div>
    </div>
  );
}
