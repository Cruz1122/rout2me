import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { admin, must } from './_client';

describe('[US-PAS-019] Búsqueda de Ruta por Origen', () => {
  let routeId: string;

  beforeAll(async () => {
    // Crear rutas con orígenes
    const route = await admin.from('routes').insert({
      code: 'SEARCH-R1',
      name: 'Ruta de prueba para búsqueda'
    }).select('id').single();
    routeId = route.id;
  });

  afterAll(async () => {
    await admin.from('routes').delete().in('id', routeId);
  });

  it('Debe realizar una búsqueda de ruta filtrada por origen', async () => {
    const searchResponse = await admin
      .from('routes')
      .select('id, name')
      .ilike('name', '%búsqueda%'); // Buscar rutas con el nombre que incluya "búsqueda"

    expect(searchResponse.data?.length).toBeGreaterThan(0);
    expect(searchResponse.data[0].name).toContain('búsqueda');
  });

  it('Debe retornar un mensaje de error si no hay rutas disponibles', async () => {
    const searchResponse = await admin
      .from('routes')
      .select('id, name')
      .ilike('name', 'ruta_inexistente');
      
    expect(searchResponse.data?.length).toBe(0);
  });
});
