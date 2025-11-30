import { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { RiArrowLeftLine, RiBusLine, RiCheckLine } from 'react-icons/ri';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getDriverBuses,
  setBusActive,
  type DriverBus,
  type DriverServiceError,
} from '../services/driverService';
import { useActiveBus } from '../hooks/useActiveBus';
import R2MLoader from '../../../shared/components/R2MLoader';
import R2MPageHeader from '../../../shared/components/R2MPageHeader';
import R2MButton from '../../../shared/components/R2MButton';
import R2MErrorToast from '../../../shared/components/R2MErrorToast';
import useErrorNotification from '../../system/hooks/useErrorNotification';
import { useTheme } from '../../../contexts/ThemeContext';

export default function DriverBusesPage() {
  const router = useIonRouter();
  const { accessToken } = useAuth();
  const { theme } = useTheme();
  const { error, handleError, clearError } = useErrorNotification();
  const { activeBusId, setActiveBus, isBusActive } = useActiveBus();

  const [buses, setBuses] = useState<DriverBus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activatingBusId, setActivatingBusId] = useState<string | null>(null);

  const loadBuses = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const driverBuses = await getDriverBuses(accessToken);
      setBuses(driverBuses);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useIonViewDidEnter(() => {
    loadBuses();
  });

  const handleActivateBus = async (bus: DriverBus) => {
    if (!accessToken) {
      handleError(new Error('No hay sesión activa'));
      return;
    }

    // Si el bus ya está activo, navegar al menú directamente
    if (isBusActive(bus.bus_id)) {
      console.log('[DriverBusesPage] Bus ya activo, navegando al menú');
      router.push('/perfil/bus-activo', 'forward');
      return;
    }

    try {
      setActivatingBusId(bus.bus_id);

      // Si hay otro bus activo, desactivarlo primero
      if (activeBusId && activeBusId !== bus.bus_id) {
        console.log(
          '[DriverBusesPage] Desactivando bus anterior:',
          activeBusId,
        );
        await setBusActive(accessToken, activeBusId, false);
      }

      // Activar el nuevo bus
      console.log('[DriverBusesPage] Activando bus:', bus.bus_id);
      await setBusActive(accessToken, bus.bus_id, true);
      setActiveBus(bus.bus_id);
      console.log(
        '[DriverBusesPage] Bus activado, activeBusId guardado:',
        bus.bus_id,
      );

      // Recargar la lista de buses
      await loadBuses();

      // Navegar al menú del bus
      console.log('[DriverBusesPage] Navegando al menú del bus');
      router.push('/perfil/bus-activo', 'forward');
    } catch (err) {
      console.error('[DriverBusesPage] Error activando bus:', err);
      handleError(err);
    } finally {
      setActivatingBusId(null);
    }
  };

  const handleDeactivateBus = async (bus: DriverBus) => {
    if (!accessToken) {
      handleError(new Error('No hay sesión activa'));
      return;
    }

    try {
      setActivatingBusId(bus.bus_id);
      await setBusActive(accessToken, bus.bus_id, false);
      setActiveBus(null);
      await loadBuses();
    } catch (err) {
      handleError(err);
    } finally {
      setActivatingBusId(null);
    }
  };

  const getStatusColor = (status: DriverBus['status']) => {
    switch (status) {
      case 'IN_SERVICE':
        return '#10B981'; // Verde
      case 'AVAILABLE':
        return '#3B82F6'; // Azul
      case 'OUT_OF_SERVICE':
        return '#EF4444'; // Rojo
      case 'MAINTENANCE':
        return '#F59E0B'; // Amarillo
      default:
        return '#6B7280'; // Gris
    }
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

  return (
    <IonPage>
      <IonContent style={{ '--background': 'var(--color-bg)' }}>
        <R2MPageHeader
          title="Mis Buses"
          leftIcon={<RiArrowLeftLine size={24} />}
          onLeftIconClick={() => router.push('/perfil', 'back')}
        />

        <div className="px-4 py-4 space-y-4">
          {buses.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                backgroundColor: 'var(--color-card)',
                border:
                  theme === 'dark' ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <RiBusLine
                size={48}
                style={{ color: 'var(--color-terciary)' }}
                className="mx-auto mb-4"
              />
              <p
                className="text-base font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                No tienes buses asignados
              </p>
              <p className="text-sm" style={{ color: 'var(--color-terciary)' }}>
                Contacta a tu administrador para asignarte un vehículo
              </p>
            </div>
          ) : (
            buses.map((bus) => {
              const isActive = isBusActive(bus.bus_id);
              const isActivating = activatingBusId === bus.bus_id;

              return (
                <div
                  key={bus.bus_id}
                  className="rounded-2xl p-6 shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    border:
                      theme === 'dark'
                        ? '1px solid var(--color-border)'
                        : 'none',
                    boxShadow:
                      theme === 'dark'
                        ? undefined
                        : '0 2px 8px 0 rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor:
                              theme === 'dark'
                                ? 'rgba(229, 231, 235, 0.15)'
                                : 'var(--color-primary)',
                          }}
                        >
                          <RiBusLine
                            size={24}
                            style={{
                              color:
                                theme === 'dark'
                                  ? 'var(--color-primary)'
                                  : '#FFFFFF',
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-xl font-bold mb-1"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {bus.plate}
                          </h3>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--color-terciary)' }}
                          >
                            {bus.company_name}
                          </p>
                        </div>
                        {isActive && (
                          <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                            }}
                          >
                            <RiCheckLine size={14} />
                            Activo
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-base font-semibold"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {bus.passenger_count} / {bus.capacity}
                          </span>
                          <span
                            className="text-sm"
                            style={{ color: 'var(--color-terciary)' }}
                          >
                            pasajeros
                          </span>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getStatusColor(bus.status)}20`,
                            color: getStatusColor(bus.status),
                          }}
                        >
                          {getStatusText(bus.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    {isActive ? (
                      <>
                        <R2MButton
                          variant="primary"
                          fullWidth
                          onClick={() => {
                            console.log(
                              '[DriverBusesPage] Navegando al menú del bus',
                            );
                            router.push('/perfil/bus-activo', 'forward');
                          }}
                        >
                          Abrir menú del bus
                        </R2MButton>
                        <R2MButton
                          variant="outline"
                          onClick={() => handleDeactivateBus(bus)}
                          disabled={isActivating}
                          loading={isActivating}
                        >
                          Desactivar
                        </R2MButton>
                      </>
                    ) : (
                      <R2MButton
                        variant="primary"
                        fullWidth
                        onClick={() => handleActivateBus(bus)}
                        disabled={isActivating}
                        loading={isActivating}
                      >
                        Activar bus
                      </R2MButton>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <R2MErrorToast error={error} onClose={clearError} />
      </IonContent>
    </IonPage>
  );
}
