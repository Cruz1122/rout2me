/**
 * Ejemplo de uso del sistema de rutas con paradas
 *
 * Este archivo muestra cómo integrar el nuevo sistema de paradas
 * en la aplicación Rout2Me.
 */

import { fetchRoutesWithStops } from '../services/routeService';
import type { Route, Stop } from '../services/routeService';

/**
 * Ejemplo de cómo cargar y mostrar rutas con paradas
 */
export async function loadRoutesWithStopsExample() {
  try {
    // Obtener rutas con paradas incluidas
    const routesWithStops = await fetchRoutesWithStops();

    console.log('Rutas cargadas con paradas:', routesWithStops);

    // Filtrar rutas que tienen paradas
    const routesWithStopsData = routesWithStops.filter(
      (route) => route.stops && route.stops.length > 0,
    );

    console.log(
      `Se encontraron ${routesWithStopsData.length} rutas con paradas`,
    );

    return routesWithStopsData;
  } catch (error) {
    console.error('Error cargando rutas con paradas:', error);
    throw error;
  }
}

/**
 * Ejemplo de cómo usar las paradas en el hook useRouteDrawing
 */
export function useRouteWithStopsExample(
  addRouteToMap: (
    routeId: string,
    coordinates: [number, number][],
    options?: any,
    stops?: Stop[],
  ) => void,
  routes: Route[],
) {
  // Graficar todas las rutas con sus paradas
  routes.forEach((route) => {
    if (route.path && route.stops) {
      console.log(
        `Graficando ruta ${route.code} con ${route.stops.length} paradas`,
      );

      addRouteToMap(
        route.id,
        route.path,
        {
          color: route.color || '#1E56A0',
          width: 6,
          opacity: 0.9,
        },
        route.stops, // Pasar las paradas como cuarto parámetro
      );
    }
  });
}

/**
 * Ejemplo de cómo mostrar información de paradas
 */
export function displayStopInfo(stops: Stop[]) {
  console.log('Información de paradas:');

  stops.forEach((stop, index) => {
    console.log(`${index + 1}. ${stop.name}`);
    console.log(`   ID: ${stop.id}`);
    console.log(`   Ubicación: [${stop.location[0]}, ${stop.location[1]}]`);
    console.log(`   Creada: ${new Date(stop.created_at).toLocaleDateString()}`);
    console.log('---');
  });
}

/**
 * Ejemplo de cómo filtrar paradas por proximidad
 */
export function filterStopsByProximity(
  stops: Stop[],
  center: [number, number],
  radiusKm: number = 1,
): Stop[] {
  const [centerLng, centerLat] = center;

  return stops.filter((stop) => {
    const [stopLng, stopLat] = stop.location;

    // Fórmula de distancia haversine (simplificada)
    const distance =
      Math.sqrt(
        Math.pow(stopLng - centerLng, 2) + Math.pow(stopLat - centerLat, 2),
      ) * 111; // Aproximación: 1 grado ≈ 111 km

    return distance <= radiusKm;
  });
}

/**
 * Ejemplo de integración completa en un componente React
 */
export function RouteWithStopsIntegrationExample() {
  // Este sería el código que iría en un componente React
  /*
  const mapInstance = useRef<MlMap | null>(null);
  const { addRouteToMap, clearAllRoutes } = useRouteDrawing(mapInstance);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        const routesWithStops = await fetchRoutesWithStops();
        setRoutes(routesWithStops);
      } catch (error) {
        console.error('Error cargando rutas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, []);

  const handleRouteSelect = (route: Route) => {
    if (route.path) {
      // Limpiar rutas anteriores
      clearAllRoutes();
      
      // Graficar nueva ruta con paradas
      addRouteToMap(
        route.id,
        route.path,
        { color: route.color },
        route.stops // Las paradas se mostrarán automáticamente
      );
    }
  };
  */
}
