import { useEffect, useState } from 'react';

export function useLocationPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setHasPermission(false);
      setIsChecking(false);
      return;
    }

    // Intentar obtener la ubicación para verificar permisos
    navigator.geolocation.getCurrentPosition(
      () => {
        // Si podemos obtener la ubicación, tenemos permisos
        setHasPermission(true);
        setIsChecking(false);
      },
      (error) => {
        // Si hay un error, verificar el código
        if (error.code === 1) {
          // PERMISSION_DENIED
          setHasPermission(false);
        } else {
          // Otro error, asumir que no hay permisos
          setHasPermission(false);
        }
        setIsChecking(false);
      },
      {
        timeout: 3000,
        maximumAge: 0,
      },
    );
  }, []);

  return { hasPermission, isChecking };
}
