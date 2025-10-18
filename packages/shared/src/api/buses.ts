import type { SupabaseClient } from '@supabase/supabase-js';

export type BusStatus =
  | 'AVAILABLE'
  | 'IN_SERVICE'
  | 'OUT_OF_SERVICE'
  | 'MAINTENANCE';
export type Bus = {
  id: string;
  company_id: string;
  plate: string;
  capacity: number;
  status: BusStatus;
  created_at: string;
  last_maintenance: string | null;
};

export async function listBuses(
  sb: SupabaseClient,
  opts?: { companyId?: string },
) {
  let q = sb
    .from('buses')
    .select('id,company_id,plate,capacity,status,created_at,last_maintenance')
    .order('created_at', { ascending: false });
  if (opts?.companyId) q = q.eq('company_id', opts.companyId);
  const { data, error } = await q;
  if (error) throw error;
  return data as Bus[];
}

export async function createBus(
  sb: SupabaseClient,
  input: {
    company_id: string;
    plate: string;
    capacity: number;
    status?: BusStatus;
  },
) {
  const { data, error } = await sb
    .from('buses')
    .insert({ status: 'AVAILABLE', ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data as Bus;
}
