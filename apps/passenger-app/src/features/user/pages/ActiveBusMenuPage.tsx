import { useEffect, useState, useRef } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import {
  RiArrowLeftLine,
  RiBusLine,
  RiCloseLine,
  RiHashtag,
} from 'react-icons/ri';
import { FaUserPlus, FaUserMinus } from 'react-icons/fa';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getDriverBuses,
  setPassengerCount,
  type DriverBus,
} from '../services/driverService';
import { useActiveBus } from '../hooks/useActiveBus';
import R2MLoader from '../../../shared/components/R2MLoader';
import R2MPageHeader from '../../../shared/components/R2MPageHeader';
import R2MButton from '../../../shared/components/R2MButton';
import R2MInput from '../../../shared/components/R2MInput';
import R2MModal from '../../../shared/components/R2MModal';
import R2MErrorToast from '../../../shared/components/R2MErrorToast';
import useErrorNotification from '../../system/hooks/useErrorNotification';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ActiveBusMenuPage() {
  const router = useIonRouter();
  const { accessToken } = useAuth();
  const { theme } = useTheme();
  const { error, handleError, clearError } = useErrorNotification();
  const { activeBusId } = useActiveBus();

  const [bus, setBus] = useState<DriverBus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCount, setCustomCount] = useState('');
  const [customCountError, setCustomCountError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadBus = async (busIdToLoad?: string) => {
    // Usar el busId proporcionado o el del hook
    const targetBusId = busIdToLoad || activeBusId;

    // Si no hay targetBusId, intentar obtenerlo del localStorage
    const storedBusId =
      targetBusId || localStorage.getItem('driver_active_bus_id');

    if (!accessToken || !storedBusId) {
      console.warn('[ActiveBusMenuPage] loadBus: No accessToken o busId');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[ActiveBusMenuPage] Cargando buses, buscando:', storedBusId);
      const buses = await getDriverBuses(accessToken);
      console.log('[ActiveBusMenuPage] Buses obtenidos:', buses.length);

      // Buscar el bus activo (puede estar marcado como is_active o coincidir con el ID)
      const activeBus = buses.find(
        (b) => b.bus_id === storedBusId || b.is_active,
      );

      if (activeBus) {
        console.log(
          '[ActiveBusMenuPage] Bus activo encontrado:',
          activeBus.plate,
        );
        setBus(activeBus);
        // Asegurarnos de que el busId esté guardado en localStorage
        if (activeBus.bus_id !== storedBusId) {
          localStorage.setItem('driver_active_bus_id', activeBus.bus_id);
        }
      } else {
        console.warn(
          '[ActiveBusMenuPage] Bus activo no encontrado en la lista',
        );
        // Si no se encuentra el bus activo, redirigir
        router.push('/perfil/mis-buses', 'back');
      }
    } catch (err) {
      console.error('[ActiveBusMenuPage] Error cargando bus:', err);
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[ActiveBusMenuPage] useEffect - activeBusId:', activeBusId);
    console.log('[ActiveBusMenuPage] useEffect - accessToken:', !!accessToken);
    console.log('[ActiveBusMenuPage] useEffect - bus actual:', bus?.plate);

    // No redirigir inmediatamente si no hay activeBusId, podría estar cargando
    if (!activeBusId && !isLoading) {
      console.warn(
        '[ActiveBusMenuPage] No hay bus activo y no está cargando, redirigiendo',
      );
      // Esperar un poco antes de redirigir para dar tiempo a que se cargue
      const timeoutId = setTimeout(() => {
        if (!activeBusId) {
          router.push('/perfil/mis-buses', 'back');
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }

    // Solo cargar si tenemos activeBusId y accessToken, y no tenemos el bus o no coincide
    if (activeBusId && accessToken && (!bus || bus.bus_id !== activeBusId)) {
      console.log(
        '[ActiveBusMenuPage] Cargando bus porque no coincide o no existe',
      );
      loadBus();
    } else if (bus && bus.bus_id === activeBusId) {
      console.log('[ActiveBusMenuPage] Bus ya cargado, no recargar');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, activeBusId]);

  useIonViewDidEnter(() => {
    console.log(
      '[ActiveBusMenuPage] useIonViewDidEnter - activeBusId:',
      activeBusId,
    );
    console.log(
      '[ActiveBusMenuPage] useIonViewDidEnter - bus actual:',
      bus?.plate,
    );
    console.log(
      '[ActiveBusMenuPage] useIonViewDidEnter - accessToken:',
      !!accessToken,
    );

    const storedBusId = localStorage.getItem('driver_active_bus_id');
    console.log(
      '[ActiveBusMenuPage] useIonViewDidEnter - Bus activo en localStorage:',
      storedBusId,
    );

    // Si ya tenemos el bus cargado y coincide con el ID almacenado, no recargar
    if (bus && storedBusId && bus.bus_id === storedBusId) {
      console.log(
        '[ActiveBusMenuPage] useIonViewDidEnter - No recargar, bus ya está cargado',
      );
      return;
    }

    // Si tenemos accessToken y un busId (del hook o localStorage), cargar
    if (accessToken && (activeBusId || storedBusId)) {
      const targetBusId = activeBusId || storedBusId;
      if (!bus || bus.bus_id !== targetBusId) {
        console.log('[ActiveBusMenuPage] useIonViewDidEnter - Recargando bus');
        loadBus(targetBusId || undefined);
      }
    }
  });

  const updatePassengerCount = async (newCount: number) => {
    if (!accessToken || !activeBusId) {
      handleError(new Error('No hay sesión activa o bus activo'));
      return;
    }

    if (newCount < 0 || (bus && newCount > bus.capacity)) {
      handleError(
        new Error(
          `La cantidad debe estar entre 0 y ${bus?.capacity || 'la capacidad del bus'}`,
        ),
      );
      return;
    }

    try {
      setIsUpdating(true);
      await setPassengerCount(accessToken, activeBusId, newCount);
      await loadBus(); // Recargar para obtener el valor actualizado
    } catch (err) {
      handleError(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = () => {
    if (bus && !isUpdating) {
      const newCount = Math.min(bus.passenger_count + 1, bus.capacity);

      // Actualizar el estado local inmediatamente para feedback visual
      setBus({ ...bus, passenger_count: newCount });

      // Limpiar timer anterior si existe
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce: esperar 1000ms antes de actualizar en el servidor
      debounceTimerRef.current = setTimeout(() => {
        updatePassengerCount(newCount);
      }, 1000);
    }
  };

  const handleDecrement = () => {
    if (bus && !isUpdating) {
      const newCount = Math.max(bus.passenger_count - 1, 0);

      // Actualizar el estado local inmediatamente para feedback visual
      setBus({ ...bus, passenger_count: newCount });

      // Limpiar timer anterior si existe
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce: esperar 1000ms antes de actualizar en el servidor
      debounceTimerRef.current = setTimeout(() => {
        updatePassengerCount(newCount);
      }, 1000);
    }
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSetZero = () => {
    updatePassengerCount(0);
  };

  const handleCustomSubmit = () => {
    const count = parseInt(customCount, 10);
    if (isNaN(count) || count < 0) {
      setCustomCountError('Ingresa un número válido mayor o igual a 0');
      return;
    }
    if (bus && count > bus.capacity) {
      setCustomCountError(
        `La cantidad no puede ser mayor a ${bus.capacity} (capacidad del bus)`,
      );
      return;
    }
    setCustomCountError(null);
    updatePassengerCount(count);
    setShowCustomModal(false);
    setCustomCount('');
  };

  const getStatusText = (status: DriverBus['status']) => {
    switch (status) {
      case 'IN_SERVICE':
        return 'En servicio';
      case 'AVAILABLE':
        return 'Disponible';
      case 'OUT_OF_SERVICE':
        return 'Fuera de servicio';
      case 'MAINTENANCE':
        return 'En mantenimiento';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div className="flex items-center justify-center h-full">
            <R2MLoader />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!bus && !isLoading) {
    console.warn('[ActiveBusMenuPage] Render: No hay bus y no está cargando');
    return (
      <IonPage>
        <IonContent style={{ '--background': 'var(--color-bg)' }}>
          <R2MPageHeader
            title="Menú del Bus"
            leftIcon={<RiArrowLeftLine size={24} />}
            onLeftIconClick={() => router.push('/perfil/mis-buses', 'back')}
            onRefresh={() => loadBus()}
          />
          <div className="flex items-center justify-center h-full px-4">
            <p style={{ color: 'var(--color-text)' }}>
              No se encontró información del bus
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!bus) {
    // Aún cargando, mostrar loader
    return (
      <IonPage>
        <IonContent style={{ '--background': 'var(--color-bg)' }}>
          <div className="flex items-center justify-center h-full">
            <R2MLoader />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Verificar que el bus tenga todas las propiedades necesarias
  if (
    !bus.plate ||
    bus.capacity === undefined ||
    bus.passenger_count === undefined
  ) {
    console.error('[ActiveBusMenuPage] Bus incompleto:', bus);
    return (
      <IonPage>
        <IonContent style={{ '--background': 'var(--color-bg)' }}>
          <R2MPageHeader
            title="Menú del Bus"
            leftIcon={<RiArrowLeftLine size={24} />}
            onLeftIconClick={() => router.push('/perfil/mis-buses', 'back')}
            onRefresh={() => loadBus()}
          />
          <div className="flex items-center justify-center h-full px-4">
            <p style={{ color: 'var(--color-text)' }}>
              Error: Información del bus incompleta
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const occupancyPercentage =
    bus.capacity > 0 ? (bus.passenger_count / bus.capacity) * 100 : 0;

  console.log('[ActiveBusMenuPage] Renderizando con bus:', {
    plate: bus.plate,
    passenger_count: bus.passenger_count,
    capacity: bus.capacity,
  });

  return (
    <IonPage>
      <IonContent
        style={{
          '--background': 'var(--color-bg)',
        }}
        fullscreen
      >
        <R2MPageHeader
          title="Menú del Bus"
          leftIcon={<RiArrowLeftLine size={24} />}
          onLeftIconClick={() => router.push('/perfil/mis-buses', 'back')}
          onRefresh={() => loadBus()}
        />

        <div
          className="flex flex-col"
          style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}
        >
          {/* Sección superior: Información del bus y contador */}
          <div
            className="relative overflow-hidden flex-1 flex flex-col justify-between"
            style={{
              background:
                theme === 'dark'
                  ? 'linear-gradient(135deg, rgba(229, 231, 235, 0.15) 0%, rgba(163, 163, 163, 0.2) 100%)'
                  : 'linear-gradient(135deg, #163172 0%, #1E56A0 100%)',
              padding: '20px 24px',
              minHeight: '45%',
            }}
          >
            {/* Información del bus */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(229, 231, 235, 0.25)'
                        : 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <RiBusLine
                    size={24}
                    style={{
                      color:
                        theme === 'dark' ? 'var(--color-primary)' : '#FFFFFF',
                    }}
                  />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold mb-0.5"
                    style={{ color: '#FFFFFF' }}
                  >
                    {bus.plate}
                  </h2>
                  <p
                    className="text-xs opacity-90"
                    style={{ color: '#FFFFFF' }}
                  >
                    {bus.company_name}
                  </p>
                </div>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor:
                    theme === 'dark'
                      ? 'rgba(229, 231, 235, 0.25)'
                      : 'rgba(255, 255, 255, 0.25)',
                  color: theme === 'dark' ? 'var(--color-primary)' : '#FFFFFF',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {getStatusText(bus.status)}
              </div>
            </div>

            {/* Contador de pasajeros - Elemento principal */}
            <div className="text-center flex-1 flex flex-col justify-center -mt-8">
              <p
                className="text-sm font-medium mb-3 opacity-90"
                style={{
                  color: theme === 'dark' ? 'var(--color-text)' : '#FFFFFF',
                }}
              >
                Pasajeros a bordo
              </p>
              <div
                className="text-9xl font-black mb-2 leading-none"
                style={{
                  color: theme === 'dark' ? 'var(--color-primary)' : '#FFFFFF',
                  textShadow:
                    theme === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                      : '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                {bus.passenger_count}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: '100px',
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(229, 231, 235, 0.3)'
                        : 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${occupancyPercentage}%`,
                      backgroundColor:
                        theme === 'dark' ? 'var(--color-primary)' : '#FFFFFF',
                    }}
                  />
                </div>
                <p
                  className="text-base font-semibold"
                  style={{
                    color: theme === 'dark' ? 'var(--color-text)' : '#FFFFFF',
                  }}
                >
                  {bus.capacity}
                </p>
              </div>
            </div>
          </div>

          {/* Sección inferior: Controles */}
          <div
            className="flex-shrink-0 px-6 py-4"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            {/* Botones principales de incremento/decremento */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleDecrement}
                disabled={isUpdating || bus.passenger_count === 0}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                style={{
                  height: '120px',
                  backgroundColor: 'var(--color-card)',
                  border:
                    theme === 'dark' ? '1px solid var(--color-border)' : 'none',
                  boxShadow:
                    theme === 'dark'
                      ? undefined
                      : '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                  }}
                >
                  <FaUserMinus size={24} />
                </div>
                <span
                  className="text-base font-bold"
                  style={{ color: 'var(--color-text)' }}
                >
                  Restar 1
                </span>
              </button>
              <button
                onClick={handleIncrement}
                disabled={isUpdating || bus.passenger_count >= bus.capacity}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                style={{
                  height: '120px',
                  backgroundColor: 'var(--color-card)',
                  border:
                    theme === 'dark' ? '1px solid var(--color-border)' : 'none',
                  boxShadow:
                    theme === 'dark'
                      ? undefined
                      : '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                  }}
                >
                  <FaUserPlus size={24} />
                </div>
                <span
                  className="text-base font-bold"
                  style={{ color: 'var(--color-text)' }}
                >
                  Sumar 1
                </span>
              </button>
            </div>

            {/* Botones secundarios */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowCustomModal(true)}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                style={{
                  height: '52px',
                  backgroundColor: 'var(--color-card)',
                  border:
                    theme === 'dark' ? '1px solid var(--color-border)' : 'none',
                  boxShadow:
                    theme === 'dark'
                      ? undefined
                      : '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <RiHashtag
                  size={18}
                  style={{ color: 'var(--color-primary)' }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  Personalizada
                </span>
              </button>
              <button
                onClick={handleSetZero}
                disabled={isUpdating || bus.passenger_count === 0}
                className="flex items-center justify-center gap-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                style={{
                  height: '52px',
                  backgroundColor: 'var(--color-card)',
                  border:
                    theme === 'dark' ? '1px solid var(--color-border)' : 'none',
                  boxShadow:
                    theme === 'dark'
                      ? undefined
                      : '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <RiCloseLine size={18} style={{ color: '#EF4444' }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  Reiniciar
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal para cantidad personalizada */}
        <R2MModal
          isOpen={showCustomModal}
          onClose={() => {
            setShowCustomModal(false);
            setCustomCount('');
            setCustomCountError(null);
          }}
          title="Cantidad de Pasajeros"
          subtitle={`Ingresa un valor entre 0 y ${bus.capacity}`}
          icon={<RiHashtag size={24} />}
        >
          <div className="space-y-4">
            <R2MInput
              type="shortName"
              placeholder="Cantidad"
              value={customCount}
              onValueChange={(value) => {
                // Solo permitir números
                const numericValue = value.replace(/\D/g, '');
                setCustomCount(numericValue);
                setCustomCountError(null);
              }}
              error={customCountError || undefined}
              hasError={!!customCountError}
            />
            <div className="flex gap-2">
              <R2MButton
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomCount('');
                  setCustomCountError(null);
                }}
              >
                Cancelar
              </R2MButton>
              <R2MButton
                variant="primary"
                fullWidth
                onClick={handleCustomSubmit}
                disabled={!customCount || isUpdating}
                loading={isUpdating}
              >
                Aplicar
              </R2MButton>
            </div>
          </div>
        </R2MModal>

        <R2MErrorToast error={error} onClose={clearError} />
      </IonContent>
    </IonPage>
  );
}
