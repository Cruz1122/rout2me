import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { admin, must, uniq } from './_client';

describe('[US-PAS-020] Visualizar Opciones de Ruta', () => {
  let routeId: string;

  beforeAll(async () => {
    const route: any = await must(
      (admin.from('routes').insert({ code: uniq('OPCION-R1'), name: 'Ruta de opciones' }).select('id').single() as any)
    );
    routeId = route.id;
  });

  afterAll(async () => {
    await admin.from('routes').delete().eq('id', routeId);
  });

  it('Debe obtener las opciones de rutas disponibles', async () => {
    const rows: any[] = await must(
      (admin.from('routes').select('id, name, code').order('name', { ascending: true }) as any)
    );

    // Debe devolver al menos una opción y contener la ruta creada en beforeAll
    expect(rows && rows.length).toBeGreaterThan(0);
    const hasRuta = rows.some((r: any) => r.name && r.name.includes('Ruta'));
    expect(hasRuta).toBeTruthy();
  });

  it('Debe realizar la transformación de datos para UI', async () => {
    const data: any = await must(admin.from('routes').select('id, name').eq('id', routeId).single() as any);
    expect(data?.name).toBe('Ruta de opciones');
  });
});
