import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ParkingPosition = { latitude: number; longitude: number };
export type DashboardParking = ParkingPosition & { id: number; location_text: string; updated_at: string };

export async function fetchDashboardParking() {
  const { data, error } = await getSupabaseBrowserClient()
    .from("dashboard_parking")
    .select("id, location_text, latitude, longitude, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const parking = data?.[0] as DashboardParking | undefined;
  return parking?.latitude != null && parking.longitude != null ? parking : null;
}

export async function saveDashboardParking(position: ParkingPosition, existingId?: number) {
  const supabase = getSupabaseBrowserClient();
  const values = { latitude: position.latitude, longitude: position.longitude, location_text: "지도에서 선택한 위치" };
  const query = existingId
    ? supabase.from("dashboard_parking").update(values).eq("id", existingId)
    : supabase.from("dashboard_parking").insert(values);
  const { data, error } = await query.select("id, location_text, latitude, longitude, updated_at").single();
  if (error) throw error;
  return data as DashboardParking;
}
