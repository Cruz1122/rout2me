import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { location } from 'ionicons/icons';
import {
  AVAILABLE_LOCATIONS,
  userLocationState,
  type LocationName,
} from '../data/userLocationMock';
import { useUserLocation } from '../hooks/useUserLocation';

/**
 * Componente de debug para simular diferentes ubicaciones del usuario
 * Solo visible en desarrollo - eliminar o comentar en producción
 */
export function UserLocationDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocation, setCurrentLocation] =
    useState<LocationName>('CENTRO_MANIZALES');
  const userLocation = useUserLocation();

  const locationLabels: Record<LocationName, string> = {
    CENTRO_MANIZALES: 'Centro de Manizales',
    CABLE_PLAZA: 'Cable Plaza',
    UNIVERSIDAD_CALDAS: 'Universidad de Caldas',
    PALERMO: 'Palermo',
    MILAN: 'Milán',
    LA_ENEA: 'La Enea',
    TERMINAL: 'Terminal de Transportes',
    ESTADIO: 'Estadio Palogrande',
  };

  const handleLocationChange = (locationName: LocationName) => {
    setCurrentLocation(locationName);
    const newLocation = AVAILABLE_LOCATIONS[locationName];
    // Update the user location state
    userLocationState.set(newLocation);
    console.log(
      `📍 Ubicación cambiada a: ${locationLabels[locationName]}`,
      newLocation,
    );
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white',
        }}
        aria-label="Toggle location debug"
      >
        <IonIcon icon={location} style={{ fontSize: '24px' }} />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-72 rounded-xl shadow-xl p-4 animate-slide-up-fade"
          style={{
            backgroundColor: 'white',
            border: '1px solid var(--color-surface)',
          }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--color-primary)' }}
          >
            🧪 Debug: Ubicación Usuario
          </h3>

          <div className="space-y-2">
            {(Object.keys(AVAILABLE_LOCATIONS) as LocationName[]).map(
              (locationName) => (
                <button
                  key={locationName}
                  onClick={() => handleLocationChange(locationName)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    backgroundColor:
                      currentLocation === locationName
                        ? 'rgba(var(--color-primary-rgb), 0.1)'
                        : 'transparent',
                    color:
                      currentLocation === locationName
                        ? 'var(--color-primary)'
                        : 'inherit',
                    fontWeight: currentLocation === locationName ? 600 : 400,
                    border: '1px solid',
                    borderColor:
                      currentLocation === locationName
                        ? 'var(--color-primary)'
                        : 'var(--color-surface)',
                  }}
                >
                  {currentLocation === locationName && '📍 '}
                  {locationLabels[locationName]}
                </button>
              ),
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <strong>Lat:</strong> {userLocation?.latitude.toFixed(4) || 'N/A'}
            <br />
            <strong>Lng:</strong> {userLocation?.longitude.toFixed(4) || 'N/A'}
          </div>

          <p className="mt-2 text-xs text-gray-400 italic">
            💡 Cambia la ubicación para ver distancias diferentes
          </p>
        </div>
      )}
    </div>
  );
}
