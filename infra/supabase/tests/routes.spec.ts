import { describe, it, expect, afterAll } from 'vitest';
import { admin, uniq, must } from './_client';
import { createRoute, createRouteVariant } from './_seed';

describe('[US-ADM-002] Leer rutas + Crear rutas', () => {
  const routeIds: string[] = [];

  afterAll(async () => {
    if (routeIds.length) {
      const { data: variants } = await admin.from('route_variants').select('id').in('route_id', routeIds);
      if (variants?.length) {
        await admin.from('route_variants').delete().in('id', variants.map(v => v.id));
      }
      await admin.from('routes').delete().in('id', routeIds);
    }
  });

  it('crea ruta OK (code único) y su variante con path JSON', async () => {
    const code = uniq('R-ACME');
    const route = await createRoute({ code, name: 'Ruta de prueba', active: true });
    routeIds.push(route.id);
    expect(route.code).toBe(code);

    const variant = await createRouteVariant(route.id);
    expect(variant.route_id).toBe(route.id);
  });

  it('rechaza código duplicado (UNIQUE en routes.code)', async () => {
    const code = uniq('R-DUP');
    const r1 = await createRoute({ code, name: 'Ruta 1' });
    routeIds.push(r1.id);

    const { error } = await admin.from('routes').insert({ code, name: 'Ruta duplicada' });
    expect(error).toBeTruthy();
    expect(error.code).toBe('23505');
  });

  it('lista rutas (ordenadas por code) y busca por nombre (ilike)', async () => {
    const r2 = await createRoute({ code: uniq('R-B'), name: 'Ruta Beta' });
    routeIds.push(r2.id);
    const r3 = await createRoute({ code: uniq('R-A'), name: 'Ruta Alfa' });
    routeIds.push(r3.id);

    const { data: list, error } = await admin
      .from('routes')
      .select('id, code, name, active, created_at')
      .order('code', { ascending: true });

    expect(error).toBeNull();
    expect(list && list.length).toBeGreaterThan(0);

    const { data: search } = await admin
      .from('routes')
      .select('id, code, name')
      .ilike('name', '%ruta%');

    expect(search && search.length).toBeGreaterThan(0);
  });

  it('detalle de ruta por id', async () => {
    const r = await createRoute({ code: uniq('R-DET'), name: 'Ruta Detalle' });
    routeIds.push(r.id);

    const { data, error } = await admin
      .from('routes')
      .select('id, code, name, active, created_at')
      .eq('id', r.id)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(r.id);
    expect(data?.code).toBe(r.code);
  });
});
