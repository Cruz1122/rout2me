import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function EmailVerified() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    // Verificar si viene desde el enlace de confirmación con tokens en el hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    // Si hay tokens en el hash, guardarlos en localStorage
    if (accessToken) {
      console.log('Tokens detectados en la URL, guardando sesión...');
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      // No retornar aquí, continuar con el countdown
    } else {
      // Verificar que el usuario llegó desde el proceso de verificación manual
      const state = location.state as { verified?: boolean } | null;

      if (!state || !state.verified) {
        // Si no viene del proceso de verificación ni tiene tokens, redirigir a signin
        navigate('/signin', { replace: true });
        return;
      }
    }

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after 8 seconds
    const redirectTimeout = setTimeout(() => {
      navigate('/signin');
    }, 8000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimeout);
    };
  }, [navigate, location]);

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] px-10 py-3">
          <div className="flex items-center gap-4 text-[#111317]">
            <div className="size-4">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 className="text-[#111317] text-lg font-bold leading-tight tracking-[-0.015em]">
              Route2Me Admin
            </h2>
          </div>
        </header>

        <div className="flex flex-1 justify-center items-center py-10">
          <div className="flex flex-col items-center max-w-md px-4 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-[#111317] text-3xl font-bold leading-tight mb-4">
              ¡Correo verificado!
            </h1>

            {/* Message */}
            <p className="text-[#646f87] text-base leading-normal mb-6">
              Tu correo electrónico ha sido verificado exitosamente. Ya puedes
              iniciar sesión en tu cuenta de Route2Me Admin.
            </p>

            {/* Email Icon */}
            <div className="mb-8">
              <svg
                className="w-24 h-24 text-[#1d56c9] opacity-20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 text-[#646f87] text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1d56c9]"></div>
              <p>
                Redirigiendo a iniciar sesión en{' '}
                <span className="font-bold text-[#1d56c9]">{countdown}</span>{' '}
                segundos...
              </p>
            </div>

            {/* Manual redirect button */}
            <button
              onClick={() => navigate('/signin')}
              className="mt-8 flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-[#1d56c9] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#1448a8] transition-colors"
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
