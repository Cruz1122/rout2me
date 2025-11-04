/**
 * Script de prueba para verificar que la API funciona correctamente
 */

import { fetchRoutesWithStops } from '../features/routes/services/routeService';

export async function testAPI() {
  try {
    console.log('🧪 Iniciando prueba de API...');

    // Probar fetchRoutesWithStops
    console.log('📡 Probando fetchRoutesWithStops...');
    const routes = await fetchRoutesWithStops();
    console.log(
      `✅ API funcionando correctamente. Rutas cargadas: ${routes.length}`,
    );

    // Mostrar información de las primeras 3 rutas
    routes.slice(0, 3).forEach((route, index) => {
      console.log(`\n📍 Ruta ${index + 1}:`);
      console.log(`   ID: ${route.id}`);
      console.log(`   Código: ${route.code}`);
      console.log(`   Nombre: ${route.name}`);
      console.log(`   Paradas: ${route.stops?.length || 0}`);
      console.log(`   Coordenadas: ${route.path?.length || 0} puntos`);
    });

    return {
      success: true,
      routesCount: routes.length,
      routesWithStops: routes.filter((r) => r.stops && r.stops.length > 0)
        .length,
    };
  } catch (error) {
    console.error('❌ Error en prueba de API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  (window as typeof window & { testAPI: typeof testAPI }).testAPI = testAPI;
}
