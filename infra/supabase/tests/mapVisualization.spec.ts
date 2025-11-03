import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { admin, must, uniq } from './_client';

describe('[US-MAP-027] Visualización de Mapa', () => {
  let routeId: string;
  const routeVariants: string[] = [];

  beforeAll(async () => {
    const route: any = await must(
      (admin.from('routes').insert({ code: uniq('ROUTE-MAP'), name: 'Ruta Mapa' }).select('id').single() as any)
    );
    routeId = route.id;
  });

  afterAll(async () => {
    if (routeVariants.length) {
      await admin.from('route_variants').delete().in('id', routeVariants);
    }
    await admin.from('routes').delete().eq('id', routeId);
  });

  it('Debe visualizar el mapa con las rutas y marcadores de paradas', async () => {
    // Simular la inserción de variantes de ruta con coordenadas
    const path = [{ lat: 5.063, lng: -75.517 }, { lat: 5.070, lng: -75.510 }];
    // La columna en el seed es `path` (JSON). Usamos `path` aquí para ser consistentes.
    const variant: any = await must(
      admin.from('route_variants').insert({ route_id: routeId, path }).select('id').single() as any
    );

    routeVariants.push(variant.id);

    // Verificar que el mapa contiene las coordenadas de la ruta (leer con `must` para asegurar error si falla)
  const data: any = await must(admin.from('route_variants').select('path').eq('route_id', routeId).single() as any);
  expect(data?.path).toEqual(path);
  });

  it('Debe permitir la selección de una ruta para visualización en el mapa', async () => {
    // Selección de una ruta (usar `must` para lanzar en caso de error)
  const data: any = await must(admin.from('routes').select('id, code').eq('id', routeId).single() as any);
  expect(data?.id).toBe(routeId);
  // El código se genera con uniq(), por eso verificamos que comience por el prefijo
  expect(String(data?.code).startsWith('ROUTE-MAP')).toBe(true);
  });
});
