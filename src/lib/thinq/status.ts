import "server-only";

import { isStaleDeviceError } from "./client";
import {
  getDeviceState,
  getWashTowerDevicePair,
  invalidateWashTowerDeviceCache,
} from "./devices";
import type { WashTowerApplianceStatus, WashTowerStatus } from "./types";

type ThinQEnvelope = { response?: unknown };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function applianceStatus(payload: ThinQEnvelope): WashTowerApplianceStatus {
  const response = payload.response;
  const root = Array.isArray(response) ? record(response[0]) : record(response);
  const runState = record(root?.runState);
  const timer = record(root?.timer);
  const state = typeof runState?.currentState === "string" ? runState.currentState : null;
  const hour = numberOrNull(timer?.remainHour);
  const minute = numberOrNull(timer?.remainMinute);

  return {
    state,
    remainingMinutes: hour === null || minute === null ? null : hour * 60 + minute,
  };
}

async function fetchStates() {
  const pair = await getWashTowerDevicePair();
  const [washer, dryer] = await Promise.all([
    getDeviceState(pair.washerDeviceId),
    getDeviceState(pair.dryerDeviceId),
  ]);
  return { washer, dryer };
}

export async function getWashTowerStatus(): Promise<WashTowerStatus> {
  let states: Awaited<ReturnType<typeof fetchStates>>;

  try {
    states = await fetchStates();
  } catch (error) {
    if (!isStaleDeviceError(error)) throw error;

    invalidateWashTowerDeviceCache();
    states = await fetchStates();
  }

  return {
    washer: applianceStatus(states.washer),
    dryer: applianceStatus(states.dryer),
    fetchedAt: new Date().toISOString(),
  };
}
