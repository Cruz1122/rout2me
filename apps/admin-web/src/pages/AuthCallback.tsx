import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import GlobalLoader from '../components/GlobalLoader';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, setAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Usar window.location directamente para capturar el hash
      const windowHash = window.location.hash;

      // Verificar si es un enlace de verificación de recuperación de contraseña
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (token && type === 'recovery') {
        navigate(`/verify-recovery?token=${token}&type=${type}`, {
          replace: true,
        });
        return;
      }

      // Verificar si hay un hash con tokens de autenticación PRIMERO
      if (windowHash) {
        const params = new URLSearchParams(windowHash.substring(1));
        const hashType = params.get('type');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        // Si es un login/registro con Google (viene con access_token pero no type específico)
        if (accessToken && !hashType) {
          try {
            // Obtener información del usuario usando el token
            const { data: userData, error: userError } =
              await supabase.auth.getUser(accessToken);

            if (userError || !userData.user) {
              console.error('Error obteniendo usuario:', userError);
              navigate('/signin?error=session_error', { replace: true });
              return;
            }

            const user = userData.user;

            const userObj = {
              id: user.id,
              email: user.email!,
              name:
                user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                user.email,
              phone: user.user_metadata?.phone || '',
            };

            // Guardar en localStorage
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(userObj));

            // Guardar en contexto
            setAuth(accessToken, refreshToken || '', userObj);

            // Redirigir al home
            navigate('/home', { replace: true });
            return;
          } catch (err) {
            console.error('Error procesando sesión:', err);
            navigate('/signin?error=session_error', { replace: true });
            return;
          }
        }

        // Otros casos de hash (recovery, signup)
        if (hashType === 'recovery' && accessToken) {
          navigate(`/reset-password${windowHash}`, { replace: true });
          return;
        } else if (hashType === 'signup' && accessToken) {
          navigate('/email-verified', {
            state: { verified: true },
            replace: true,
          });
          return;
        }
      }

      // Verificar si hay un código de OAuth (Google) - flujo PKCE
      const code = searchParams.get('code');
      if (code) {
        try {
          // Intercambiar el código por una sesión
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Error al intercambiar código:', error);
            navigate('/signin?error=oauth_exchange', { replace: true });
            return;
          }

          if (data.session) {
            // Guardar la sesión en el contexto
            const user = data.session.user;
            const accessToken = data.session.access_token;
            const refreshToken = data.session.refresh_token;

            const userObj = {
              id: user.id,
              email: user.email!,
              name:
                user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                user.email,
              phone: user.user_metadata?.phone || '',
            };

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userObj));

            setAuth(accessToken, refreshToken, userObj);

            // Redirigir al home
            navigate('/home', { replace: true });
            return;
          }
        } catch (err) {
          console.error('Error procesando OAuth:', err);
          navigate('/signin?error=oauth_error', { replace: true });
          return;
        }
      }

      // Esperar a que termine de cargar la autenticación
      if (isLoading) {
        return;
      }

      // No hay hash ni código, verificar si está autenticado
      if (isAuthenticated) {
        // Si está autenticado, ir a home
        navigate('/home', { replace: true });
      } else {
        // Si no está autenticado, ir a signin
        navigate('/signin', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, isAuthenticated, isLoading, searchParams, setAuth]);

  return <GlobalLoader />;
}
