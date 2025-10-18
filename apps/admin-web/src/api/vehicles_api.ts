export type VehicleCreate = {
  company: string;
  plate: string;
  capacity: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Offline';
};

export async function createVehicle(payload: VehicleCreate) {
  // Example endpoint - replace with your real API
  const res = await fetch('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create vehicle failed: ${res.status} ${text}`);
  }

  return res.json();
}
