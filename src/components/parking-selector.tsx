"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { fetchDashboardParking, saveDashboardParking, type DashboardParking, type ParkingPosition } from "@/lib/dashboard-parking";
import { homeLocation } from "@/lib/home-location";
import type { ParkingPickerMapProps } from "./parking-picker-map";
import styles from "./parking-selector.module.css";

const DEFAULT_POSITION: ParkingPosition = { latitude: 37.668, longitude: 126.786 };
const ParkingPickerMap = dynamic<ParkingPickerMapProps>(() => import("./parking-picker-map").then((module) => module.ParkingPickerMap), { ssr: false, loading: () => <div className={styles.mapLoading}>지도를 불러오는 중이에요…</div> });

export function ParkingSelector() {
  const [candidate, setCandidate] = useState<ParkingPosition>(DEFAULT_POSITION);
  const [saved, setSaved] = useState<DashboardParking | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchDashboardParking().then((parking) => { if (active && parking) { setSaved(parking); setCandidate(parking); } }).catch(() => { if (active) setError("저장된 주차 위치를 불러오지 못했어요."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = window.setTimeout(() => setSaveSuccess(false), 3_000);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  function useCurrentLocation() {
    if (!navigator.geolocation) { setError("이 기기에서는 현재 위치를 사용할 수 없어요."); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition((position) => {
      setCandidate({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setRecenterSignal((current) => current + 1);
      setLocating(false);
    }, () => { setError("현재 위치를 가져오지 못했어요. 위치 권한을 확인해 주세요."); setLocating(false); }, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
  }

  function moveToHome() {
    if (!homeLocation) return;
    setCandidate(homeLocation);
    setRecenterSignal((current) => current + 1);
  }

  async function savePosition() {
    setSaving(true); setError(null); setSaveSuccess(false);
    try { setSaved(await saveDashboardParking(candidate, saved?.id)); setSaveSuccess(true); }
    catch { setError("주차 위치를 저장하지 못했어요."); }
    finally { setSaving(false); }
  }

  return <section className={styles.section} aria-labelledby="parking-heading"><div className={styles.heading}><span className={styles.icon}>⌖</span><div><h2 id="parking-heading">주차 위치</h2><p>지도를 움직여 중앙 핀에 차 위치를 맞추세요.</p></div></div>{loading ? <div className={styles.mapLoading}>저장된 위치를 확인하는 중이에요…</div> : <ParkingPickerMap center={candidate} recenterSignal={recenterSignal} onCenterChange={setCandidate} />}<p className={styles.coordinates}>선택 위치 · {candidate.latitude.toFixed(5)}, {candidate.longitude.toFixed(5)}</p><div className={styles.actions}><button type="button" className={styles.locationButton} onClick={useCurrentLocation} disabled={locating || saving}>{locating ? "위치 확인 중…" : "현재 위치"}</button>{homeLocation && <button type="button" className={styles.locationButton} onClick={moveToHome} disabled={saving}>집으로 이동</button>}<button type="button" className={styles.saveButton} onClick={() => void savePosition()} disabled={saving || locating}>{saving ? "저장 중…" : "이 위치에 주차했어요"}</button></div>{saved && <p className={styles.saved}>마지막 저장 · {new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(saved.updated_at))}</p>}{error && <p className={styles.error} role="alert">{error}</p>}{saveSuccess && <p className={styles.successToast} role="status">저장되었습니다.</p>}</section>;
}
