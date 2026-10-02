"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WashTowerStatus } from "@/lib/thinq/types";

export const WASH_TOWER_IDLE_INTERVAL_MS = 5 * 60 * 1_000;
export const WASH_TOWER_ACTIVE_INTERVAL_MS = 60 * 1_000;
export const WASH_TOWER_END_GRACE_MS = 15 * 60 * 1_000;

export type UseWashTowerStatusResult = {
  status: WashTowerStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function isWashTowerActiveState(state: string | null) {
  return state !== null && state !== "POWER_OFF" && state !== "END";
}

export function getWashTowerPollingInterval(
  status: WashTowerStatus | null,
  lastEndDetectedAt: number | null,
  now = Date.now(),
) {
  if (!status) return WASH_TOWER_ACTIVE_INTERVAL_MS;

  const states = [status.washer.state, status.dryer.state];
  if (states.some(isWashTowerActiveState) || states.includes("END")) {
    return WASH_TOWER_ACTIVE_INTERVAL_MS;
  }

  if (lastEndDetectedAt !== null && now - lastEndDetectedAt < WASH_TOWER_END_GRACE_MS) {
    return WASH_TOWER_ACTIVE_INTERVAL_MS;
  }

  return WASH_TOWER_IDLE_INTERVAL_MS;
}

function isWashTowerStatus(value: unknown): value is WashTowerStatus {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  const isAppliance = (appliance: unknown) => {
    if (typeof appliance !== "object" || appliance === null || Array.isArray(appliance)) return false;
    const item = appliance as Record<string, unknown>;
    return (typeof item.state === "string" || item.state === null)
      && (typeof item.remainingMinutes === "number" || item.remainingMinutes === null);
  };

  return isAppliance(data.washer)
    && isAppliance(data.dryer)
    && typeof data.fetchedAt === "string";
}

export function useWashTowerStatus(): UseWashTowerStatusResult {
  const [status, setStatus] = useState<WashTowerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<WashTowerStatus | null>(null);
  const lastEndDetectedAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const refresh = useCallback(() => refreshRef.current(), []);

  useEffect(() => {
    let active = true;

    const clearScheduledRefresh = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleNextRefresh = (nextStatus: WashTowerStatus | null) => {
      clearScheduledRefresh();
      const delay = getWashTowerPollingInterval(
        nextStatus,
        lastEndDetectedAtRef.current,
      );
      timeoutRef.current = window.setTimeout(() => {
        void refreshRef.current();
      }, delay);
    };

    const load = async (): Promise<void> => {
      if (inFlightRef.current) return inFlightRef.current;

      const controller = new AbortController();
      controllerRef.current = controller;
      const request = (async () => {
        try {
          const response = await fetch("/api/thinq/status", {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("WashTower request failed");

          const data: unknown = await response.json();
          if (!isWashTowerStatus(data)) throw new Error("Invalid WashTower response");
          if (!active) return;

          if (data.washer.state === "END" || data.dryer.state === "END") {
            lastEndDetectedAtRef.current = Date.now();
          }
          statusRef.current = data;
          setStatus(data);
          setError(null);
          scheduleNextRefresh(data);
        } catch {
          if (!active || controller.signal.aborted) return;

          setError("워시타워 상태를 불러오지 못했어요.");
          scheduleNextRefresh(statusRef.current);
        } finally {
          if (controllerRef.current === controller) {
            inFlightRef.current = null;
            controllerRef.current = null;
          }
          if (active) setLoading(false);
        }
      })();

      inFlightRef.current = request;
      return request;
    };

    refreshRef.current = load;
    void load();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      clearScheduledRefresh();
      controllerRef.current?.abort();
      controllerRef.current = null;
      inFlightRef.current = null;
      refreshRef.current = async () => {};
    };
  }, []);

  return { status, loading, error, refresh };
}
