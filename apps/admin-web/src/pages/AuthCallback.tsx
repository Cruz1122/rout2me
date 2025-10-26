import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Esperar a que termine de cargar la autenticación
    if (isLoading) return;

    // Verificar si hay un hash con tokens de autenticación
    const hash = location.hash;

    if (hash) {
      // Extraer el tipo de la URL hash
      const params = new URLSearchParams(hash.substring(1));
      const type = params.get('type');
      const accessToken = params.get('access_token');

      if (type === 'signup' && accessToken) {
        // Usuario confirmó su email desde el signup
        // Redirigir a la página de agradecimiento con estado de verificación
        navigate('/email-verified', {
          state: { verified: true },
          replace: true,
        });
      } else if (accessToken) {
        // Otros casos de autenticación
        navigate('/signin', { replace: true });
      }
    } else {
      // No hay hash, verificar si está autenticado
      if (isAuthenticated) {
        // Si está autenticado, ir a home
        navigate('/home', { replace: true });
      } else {
        // Si no está autenticado, ir a signin
        navigate('/signin', { replace: true });
      }
    }
  }, [location, navigate, isAuthenticated, isLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d56c9] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redireccionando...</p>
      </div>
    </div>
  );
}
