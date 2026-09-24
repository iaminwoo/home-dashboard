import type { ParkingPosition } from "@/lib/dashboard-parking";

function parseCoordinate(value: string | undefined, min: number, max: number) {
  if (!value?.trim()) return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : null;
}

const latitude = parseCoordinate(process.env.NEXT_PUBLIC_HOME_LATITUDE, -90, 90);
const longitude = parseCoordinate(process.env.NEXT_PUBLIC_HOME_LONGITUDE, -180, 180);

/** Null when the home location is absent or contains invalid coordinates. */
export const homeLocation: ParkingPosition | null = latitude === null || longitude === null ? null : { latitude, longitude };
