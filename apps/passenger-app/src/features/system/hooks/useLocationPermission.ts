import { useEffect, useState } from 'react';
import {
  checkLocationPermission,
  markPermissionGranted,
} from '../utils/checkLocationPermission';

export function useLocationPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Usar la función utilitaria optimizada para verificación rápida
    checkLocationPermission(true)
      .then((hasPerm) => {
        setHasPermission(hasPerm);
        setIsChecking(false);
        // Si los permisos están otorgados, marcarlos para futuras verificaciones
        if (hasPerm) {
          markPermissionGranted();
        }
      })
      .catch((error) => {
        console.error('Error al verificar permisos de localización:', error);
        setHasPermission(false);
        setIsChecking(false);
      });
  }, []);

  return { hasPermission, isChecking };
}
