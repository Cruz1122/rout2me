/**
 * Script de debug para verificar que las paradas se cargan correctamente
 */

import { fetchRoutesWithStops } from '../services/routeService';

export async function debugParadas() {
  try {
    console.log('🔍 Iniciando debug de paradas...');

    // Cargar rutas con paradas
    const routes = await fetchRoutesWithStops();
    console.log(`📊 Total de rutas cargadas: ${routes.length}`);

    // Filtrar rutas que tienen paradas
    const routesWithStops = routes.filter(
      (route) => route.stops && route.stops.length > 0,
    );
    console.log(`🚌 Rutas con paradas: ${routesWithStops.length}`);

    // Mostrar información detallada de cada ruta con paradas
    routesWithStops.forEach((route, index) => {
      console.log(`\n📍 Ruta ${index + 1}: ${route.code} - ${route.name}`);
      console.log(`   ID: ${route.id}`);
      console.log(`   Paradas: ${route.stops?.length || 0}`);

      if (route.stops && route.stops.length > 0) {
        route.stops.forEach((stop, stopIndex) => {
          console.log(`   🛑 Parada ${stopIndex + 1}: ${stop.name}`);
          console.log(`      ID: ${stop.id}`);
          console.log(
            `      Ubicación: [${stop.location[0]}, ${stop.location[1]}]`,
          );
        });
      }
    });

    // Verificar que las paradas tienen el formato correcto
    const allStops = routesWithStops.flatMap((route) => route.stops || []);
    console.log(`\n📈 Total de paradas únicas: ${allStops.length}`);

    // Verificar formato de ubicaciones
    const invalidLocations = allStops.filter(
      (stop) =>
        !Array.isArray(stop.location) ||
        stop.location.length !== 2 ||
        typeof stop.location[0] !== 'number' ||
        typeof stop.location[1] !== 'number',
    );

    if (invalidLocations.length > 0) {
      console.warn(
        `⚠️  Paradas con ubicaciones inválidas: ${invalidLocations.length}`,
      );
      invalidLocations.forEach((stop) => {
        console.warn(`   - ${stop.name}: ${JSON.stringify(stop.location)}`);
      });
    } else {
      console.log('✅ Todas las paradas tienen ubicaciones válidas');
    }

    return {
      totalRoutes: routes.length,
      routesWithStops: routesWithStops.length,
      totalStops: allStops.length,
      invalidLocations: invalidLocations.length,
    };
  } catch (error) {
    console.error('❌ Error en debug de paradas:', error);
    throw error;
  }
}

// Función para probar la integración con el mapa
export function testMapIntegration() {
  console.log('🗺️  Para probar la integración con el mapa:');
  console.log('1. Abre la consola del navegador');
  console.log('2. Ejecuta: window.debugParadas()');
  console.log('3. Busca una ruta en la aplicación');
  console.log('4. Verifica que aparezcan marcadores naranjas para las paradas');
}

// Hacer disponible globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).debugParadas = debugParadas;
  (window as any).testMapIntegration = testMapIntegration;
}
