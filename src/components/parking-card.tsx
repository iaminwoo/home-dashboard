"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { fetchDashboardParking, type DashboardParking, type ParkingPosition } from "@/lib/dashboard-parking";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-cards.module.css";

const ParkingDisplayMap = dynamic<{ position: ParkingPosition }>(() => import("./parking-display-map").then((module) => module.ParkingDisplayMap), { ssr: false, loading: () => <div className={styles.mapPlaceholder}>지도를 불러오는 중이에요…</div> });

export function ParkingCard() {
  const [parking, setParking] = useState<DashboardParking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => { let active = true; void fetchDashboardParking().then((data) => { if (active) setParking(data); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);

  return <section className={`${styles.card} ${styles.parkingCard}`}><div className={styles.cardHeader}><span className={styles.icon}><DashboardIcon name="parking" /></span><h2>차량 위치</h2></div>{loading ? <div className={styles.empty}><strong>주차 위치를 불러오는 중이에요</strong></div> : error ? <div className={styles.empty}><strong>주차 위치를 불러오지 못했어요</strong><span>잠시 후 화면을 새로고침해 주세요.</span></div> : parking ? <><ParkingDisplayMap position={parking} /><p className={styles.hint}>마지막 저장 · {new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(parking.updated_at))}</p></> : <div className={styles.empty}><strong>등록된 주차 위치가 없어요</strong><span>관리 페이지에서 위치를 저장해 보세요.</span></div>}</section>;
}
