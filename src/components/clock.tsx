"use client";

import { useEffect, useState } from "react";
import styles from "./clock.module.css";

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { const update = () => setNow(new Date()); update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer); }, []);
  if (!now) return <div className={styles.loading} aria-label="시간 불러오는 중" />;
  const parts = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const date = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(now);
  return <div className={styles.clock}><p className={styles.period}>{part("dayPeriod")}</p><time className={styles.time}>{part("hour")}:{part("minute")}</time><p className={styles.date}>{date}</p></div>;
}
