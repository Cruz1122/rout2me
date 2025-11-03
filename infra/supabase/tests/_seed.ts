import { admin, uniq, must } from './_client';

export async function ensureCompany(): Promise<{ id: string; name: string; short_name: string }> {
  const company = { name: `QA ${uniq('Company')}`, short_name: uniq('QA') };
  const rows = await must(
    admin.from('companies').insert(company).select('id, name, short_name').single()
  );
  return rows as any;
}

export async function createRoute({
  code,
  name,
  active = true
}: { code: string; name: string; active?: boolean }) {
  return must(
    admin.from('routes').insert({ code, name, active }).select('id, code, name, active').single()
  );
}

export async function createRouteVariant(route_id: string) {
  // path simple: línea de dos puntos
  const path = [{ lat: 5.063, lng: -75.517 }, { lat: 5.070, lng: -75.510 }];
  return must(
    admin.from('route_variants')
      .insert({ route_id, path })
      .select('id, route_id')
      .single()
  );
}
