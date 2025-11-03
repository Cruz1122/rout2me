import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { admin, must, uniq } from './_client';

describe('[US-PAS-022] Seleccionar Ruta', () => {
  let routeId: string;

  beforeAll(async () => {
    const route: any = await must(
      (admin.from('routes').insert({ code: uniq('SELECT-R1'), name: 'Ruta de prueba de selección' }).select('id').single() as any)
    );
    routeId = route.id;
  });

  afterAll(async () => {
    await admin.from('routes').delete().eq('id', routeId);
  });

  it('Debe permitir seleccionar una ruta de la lista y mostrar detalles', async () => {
    const data: any = await must(admin.from('routes').select('id, name, code').eq('id', routeId).single() as any);

    expect(data?.id).toBe(routeId);
    expect(data?.name).toBe('Ruta de prueba de selección');
  });

  it('Debe retornar error si la ruta no existe', async () => {
    const response = await admin
      .from('routes')
      .select('id, name')
      .eq('id', 'ruta_inexistente_id')
      .single();

    expect(response.error).toBeTruthy();
  });
});
