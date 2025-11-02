import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { admin, uniq, must } from './_client';
import { ensureCompany, createRoute, createRouteVariant } from './_seed';

describe('[US-ADM-005] Crear bus & [US-ADM-006] Leer bus', () => {
  let company: { id: string; short_name: string };
  const createdBusIds: string[] = [];
  const createdRouteIds: string[] = [];
  const createdAssignIds: string[] = [];

  beforeAll(async () => {
    company = await ensureCompany();
  });

  afterAll(async () => {
    // Limpieza en orden: assignments -> buses -> routes/variants
    if (createdAssignIds.length) {
      await admin.from('assignments').delete().in('id', createdAssignIds);
    }
    if (createdBusIds.length) {
      await admin.from('buses').delete().in('id', createdBusIds);
    }
    if (createdRouteIds.length) {
      // variants tienen FK a routes, borrar variants primero
      const { data: variants } = await admin.from('route_variants').select('id').in('route_id', createdRouteIds);
      if (variants?.length) {
        await admin.from('route_variants').delete().in('id', variants.map(v => v.id));
      }
      await admin.from('routes').delete().in('id', createdRouteIds);
    }
  });

  it('crea bus OK (placa única, capacidad > 0, estado default)', async () => {
    const plate = uniq('MZL123');
    const bus = await must(
      admin.from('buses')
        .insert({
          company_id: company.id,
          plate,
          capacity: 40 // > 0
          // status default: AVAILABLE
        })
        .select('id, plate, capacity, status, company_id')
        .single()
    );

    expect(bus.id).toBeTruthy();
    expect(bus.plate).toBe(plate);
    expect(bus.capacity).toBe(40);
    createdBusIds.push(bus.id);
  });

  it('rechaza placa duplicada', async () => {
    const plate = uniq('DUP111');
    const first = await must(
      admin.from('buses')
        .insert({ company_id: company.id, plate, capacity: 35 })
        .select('id')
        .single()
    );
    createdBusIds.push(first.id);

    const { error } = await admin.from('buses').insert({
      company_id: company.id,
      plate,           // duplicada
      capacity: 20
    });

    // Postgres unique violation
    expect(error).toBeTruthy();
    expect(error.code).toBe('23505');
  });

  it('capacidad 0 debe ser rechazada por la regla de negocio (> 0)', async () => {
    const { error } = await admin.from('buses').insert({
      company_id: company.id,
      plate: uniq('BAD000'),
      capacity: 0
    });

    // Si tu BD aún permite 0 (CHECK >= 0), este test FALLARÁ para señalar que falta la validación.
    // Recomendado: CHECK (capacity > 0)
    expect(error).toBeTruthy();
  });

  it('lista buses con filtro por company_id', async () => {
    // asegurar otro bus
    const extra = await must(
      admin.from('buses')
        .insert({ company_id: company.id, plate: uniq('MZL234'), capacity: 50 })
        .select('id')
        .single()
    );
    createdBusIds.push(extra.id);

    const { data, error } = await admin
      .from('buses')
      .select('id, plate, capacity, company_id')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    expect(error).toBeNull();
    expect(data && data.length).toBeGreaterThan(0);
  });

  it('detalle de bus e indica si tiene ruta asignada (via assignments)', async () => {
    // crear una ruta y asignarla a uno de los buses
    const route = await createRoute({ code: uniq('R-01'), name: 'Ruta QA' });
    createdRouteIds.push(route.id);
    await createRouteVariant(route.id);

    const bus = await must(
      admin.from('buses')
        .insert({ company_id: company.id, plate: uniq('MZL999'), capacity: 42 })
        .select('id, plate')
        .single()
    );
    createdBusIds.push(bus.id);

    // crear assignment activo (unassigned_at = null)
    const assignment = await must(
      admin.from('assignments')
        .insert({ bus_id: bus.id, route_id: route.id })
        .select('id, bus_id, route_id')
        .single()
    );
    createdAssignIds.push(assignment.id);

    // consulta detalle + flag de “tiene ruta”
    const { data: detail } = await admin
      .from('buses')
      .select('id, plate, capacity')
      .eq('id', bus.id)
      .single();

    const { data: assigned } = await admin
      .from('assignments')
      .select('id, route_id')
      .eq('bus_id', bus.id)
      .is('unassigned_at', null);

    const hasRoute = Boolean(assigned && assigned.length > 0);

    expect(detail?.id).toBe(bus.id);
    expect(hasRoute).toBe(true);
  });
});
