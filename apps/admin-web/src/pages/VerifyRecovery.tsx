import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabaseConfig } from '../lib/supabase';
import { colorClasses } from '../styles/colors';
import AuthHeader from '../components/AuthHeader';

export default function VerifyRecovery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        console.log('Token recibido:', token);
        console.log('Type:', type);

        if (!token || type !== 'recovery') {
          setStatus('error');
          setErrorMessage('Enlace de recuperación inválido');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        // Verificar el token con Supabase
        const response = await fetch(
          `${supabaseConfig.url}/auth/v1/verify?token=${token}&type=recovery`,
          {
            method: 'GET',
            headers: {
              apikey: supabaseConfig.anonKey,
            },
            redirect: 'manual',
          },
        );

        console.log('Response status:', response.status);

        // Supabase devuelve una redirección 303 con el access_token en el Location header
        if (response.status === 303 || response.type === 'opaqueredirect') {
          // Si hay redirección, extraer el access_token del Location header
          const locationHeader = response.headers.get('Location');
          console.log('Location header:', locationHeader);

          if (locationHeader) {
            const url = new URL(locationHeader);
            const hashParams = new URLSearchParams(url.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken) {
              // Guardar tokens y redirigir a reset-password con el hash completo
              localStorage.setItem('recovery_access_token', accessToken);
              if (refreshToken) {
                localStorage.setItem('recovery_refresh_token', refreshToken);
              }

              // Redirigir con el hash completo
              window.location.href = `/reset-password${url.hash}`;
              return;
            }
          }
        }

        // Si llegamos aquí, intentar hacer la verificación de otra forma
        // Llamar directamente al endpoint de verificación
        const verifyResponse = await fetch(
          `${supabaseConfig.url}/auth/v1/verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseConfig.anonKey,
            },
            body: JSON.stringify({
              token,
              type: 'recovery',
            }),
          },
        );

        const result = await verifyResponse.json();
        console.log('Verify result:', result);

        if (result.access_token) {
          // Guardar tokens
          localStorage.setItem('recovery_access_token', result.access_token);
          if (result.refresh_token) {
            localStorage.setItem(
              'recovery_refresh_token',
              result.refresh_token,
            );
          }

          // Redirigir a reset-password con los tokens
          navigate(
            `/reset-password#access_token=${result.access_token}&type=recovery`,
          );
          return;
        }

        // Si no hay access_token, mostrar error
        setStatus('error');
        setErrorMessage('No se pudo verificar el enlace de recuperación');
        setTimeout(() => navigate('/signin'), 3000);
      } catch (error) {
        console.error('Error al verificar token:', error);
        setStatus('error');
        setErrorMessage('Error al procesar el enlace de recuperación');
        setTimeout(() => navigate('/signin'), 3000);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <AuthHeader />
        <div className="flex flex-1 justify-center items-center py-5">
          <div className="flex flex-col items-center max-w-md px-4 text-center gap-6">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E56A0]"></div>
                <h1
                  className={`${colorClasses.textPrimary} text-2xl font-bold`}
                >
                  Verificando enlace...
                </h1>
                <p className={`${colorClasses.textSecondary} text-base`}>
                  Por favor espera mientras procesamos tu solicitud
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex items-center justify-center rounded-full bg-red-50 w-20 h-20">
                  <i className="ri-error-warning-line text-5xl text-red-600"></i>
                </div>
                <h1
                  className={`${colorClasses.textPrimary} text-2xl font-bold`}
                >
                  Error
                </h1>
                <p className={`${colorClasses.textSecondary} text-base`}>
                  {errorMessage}
                </p>
                <p className={`${colorClasses.textTerciary} text-sm`}>
                  Serás redirigido al inicio de sesión...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
