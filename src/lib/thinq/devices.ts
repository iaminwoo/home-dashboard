import "server-only";

import { thinqGet } from "./client";
import type { ThinQDevice, WashTowerDevicePair } from "./types";

const DEVICE_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const WASHER_TYPE = "DEVICE_WASHTOWER_WASHER";
const DRYER_TYPE = "DEVICE_WASHTOWER_DRYER";

let cachedDevicePair: WashTowerDevicePair | null = null;

type ThinQEnvelope = { response?: unknown };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeDevices(payload: ThinQEnvelope): ThinQDevice[] {
  if (!Array.isArray(payload.response)) return [];

  return payload.response.flatMap((value) => {
    const device = record(value);
    const info = record(device?.deviceInfo);
    const deviceId = stringOrNull(device?.deviceId);
    if (!deviceId) return [];

    return [{
      deviceId,
      deviceInfo: {
        groupId: stringOrNull(info?.groupId),
        deviceType: stringOrNull(info?.deviceType),
      },
    }];
  });
}

function findWashTowerPair(devices: ThinQDevice[]): WashTowerDevicePair {
  const groups = new Map<string, ThinQDevice[]>();

  for (const device of devices) {
    const groupId = device.deviceInfo.groupId;
    if (!groupId) continue;
    const group = groups.get(groupId) ?? [];
    group.push(device);
    groups.set(groupId, group);
  }

  const pairs = [...groups.entries()].flatMap(([groupId, group]) => {
    const washer = group.find((device) => device.deviceInfo.deviceType === WASHER_TYPE);
    const dryer = group.find((device) => device.deviceInfo.deviceType === DRYER_TYPE);
    return washer && dryer ? [{ groupId, washerDeviceId: washer.deviceId, dryerDeviceId: dryer.deviceId, cachedAt: Date.now() }] : [];
  });

  if (pairs.length === 0) throw new Error("워시타워 washer/dryer 기기 쌍을 찾지 못했습니다.");
  if (pairs.length > 1) throw new Error("여러 워시타워 그룹이 발견되었습니다. 사용할 그룹을 설정해 주세요.");

  return pairs[0];
}

export function invalidateWashTowerDeviceCache() {
  cachedDevicePair = null;
}

export async function getWashTowerDevicePair(): Promise<WashTowerDevicePair> {
  if (cachedDevicePair && Date.now() - cachedDevicePair.cachedAt < DEVICE_CACHE_TTL_MS) {
    return cachedDevicePair;
  }

  const devices = normalizeDevices(await thinqGet<ThinQEnvelope>("/devices", "devices"));
  cachedDevicePair = findWashTowerPair(devices);
  return cachedDevicePair;
}

export function getDeviceState(deviceId: string) {
  return thinqGet<ThinQEnvelope>(`/devices/${encodeURIComponent(deviceId)}/state`, "device-state");
}
