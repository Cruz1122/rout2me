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

/**
 * Bloque adicional para US de administración sobre rutas:
 *
 * - [US-ADM-004] Eliminar ruta
 * - [US-ADM-003] Actualizar ruta
 */
describe('[US-ADM-003 & US-ADM-004] Actualizar y eliminar rutas (casos de error)', () => {
  /**
   * [US-ADM-004] Test para eliminar una ruta que no exista.
   *
   * Usamos un UUID dummy que estamos seguros que no está en la tabla y
   * verificamos que:
   *  - no se borra ninguna fila
   *  - y/o la capa de datos devuelve un error o código 4xx según diseño.
   */
  it('intentar eliminar una ruta inexistente no afecta la tabla', async () => {
    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const { error, status, count } = await admin
      .from('routes')
      .delete({ count: 'exact' })
      .eq('id', nonExistingId);

    // Lo importante: no hay filas afectadas.
    expect(count === 0).toBe(true);

    // Opcionalmente documentamos los posibles códigos según implementación.
    if (error) {
      expect([400, 404].includes(status ?? 0)).toBe(true);
    }
  });

  /**
   * [US-ADM-003] Test de editar una ruta existente con valores inválidos.
   *
   * Aprovechamos la constraint UNIQUE en `routes.code` y probamos que al
   * actualizar el código de una ruta a un valor ya utilizado por otra ruta,
   * la BD devuelve error (violación de UNIQUE).
   */
  it('rechaza actualizar una ruta con un code duplicado (valor inválido)', async () => {
    // Creamos dos rutas con códigos distintos
    const r1 = await createRoute({ code: uniq('R-UPD-A'), name: 'Ruta Update A' });
    const r2 = await createRoute({ code: uniq('R-UPD-B'), name: 'Ruta Update B' });

    // Intentamos actualizar r2 para que tenga el mismo code que r1
    const { error } = await admin
      .from('routes')
      .update({ code: r1.code })
      .eq('id', r2.id);

    // Debe dispararse la misma constraint UNIQUE (23505)
    expect(error).toBeTruthy();
    expect(error!.code).toBe('23505');
  });

  /**
   * [US-ADM-003] Test de editar una ruta que no existe.
   *
   * Se intenta hacer UPDATE sobre un id inexistente y se comprueba que:
   *  - no haya filas afectadas
   *  - y que, si se devuelve error, sea un 4xx (según diseño).
   */
  it('intentar actualizar una ruta inexistente no afecta la tabla', async () => {
    const nonExistingId = '00000000-0000-0000-0000-000000000000';

    const { error, status, count } = await admin
      .from('routes')
      .update({ name: 'Ruta Fantasma' })
      .eq('id', nonExistingId);

    expect(count === 0).toBe(true);

    if (error) {
      expect([400, 404].includes(status ?? 0)).toBe(true);
    }
  });
});