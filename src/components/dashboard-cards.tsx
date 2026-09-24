"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, calendarDayLabel, calendarTime, koreaDateKey, koreaTodayKey, type DashboardCalendarEvent } from "@/lib/calendar-events";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-cards.module.css";

type CardProps = { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string };
function Card({ title, icon, children, className = "" }: CardProps) { return <section className={`${styles.card} ${className}`}><div className={styles.cardHeader}><span className={styles.icon}>{icon}</span><h2>{title}</h2></div>{children}</section>; }

const TODAY_LIMIT = 5;
const FUTURE_LIMIT = 4;

function EventRows({ events, compact = false }: { events: DashboardCalendarEvent[]; compact?: boolean }) {
  return <ol className={compact ? styles.upcomingList : styles.calendarList}>{events.map((event) => <li key={event.id}>{compact && <span className={styles.day}>{calendarDayLabel(koreaDateKey(event.start, event.allDay))}</span>}<time>{calendarTime(event)}</time><strong>{event.summary}</strong></li>)}</ol>;
}

export function CalendarCard() {
  const [events, setEvents] = useState<DashboardCalendarEvent[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/calendar", { cache: "no-store" });
        if (!response.ok) throw new Error("Calendar request failed");
        const data = (await response.json()) as { events: DashboardCalendarEvent[] };
        if (active) { setEvents(data.events); setError(false); }
      } catch { if (active) setError(true); }
    };
    void load();
    const timer = window.setInterval(load, 15 * 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const grouped = useMemo(() => {
    const today = koreaTodayKey();
    const tomorrow = addDays(today, 1);
    return {
      today: (events ?? []).filter((event) => koreaDateKey(event.start, event.allDay) === today),
      tomorrow: (events ?? []).filter((event) => koreaDateKey(event.start, event.allDay) === tomorrow),
      upcoming: (events ?? []).filter((event) => koreaDateKey(event.start, event.allDay) > tomorrow),
    };
  }, [events]);

  return <Card title="일정" icon={<DashboardIcon name="calendar" />} className={styles.calendarCard}>
    {error ? <div className={styles.calendarEmpty}><strong>일정을 불러오지 못했어요</strong><span>연결 설정과 네트워크를 확인해 주세요.</span></div> : events === null ? <div className={styles.calendarEmpty}><strong>일정을 불러오는 중이에요</strong></div> : <div className={styles.calendarContent}>
      <div className={styles.scheduleTopGrid}>
        <section className={`${styles.scheduleSection} ${styles.todaySection}`}><p className={styles.scheduleLabel}>오늘</p>{grouped.today.length ? <><EventRows events={grouped.today.slice(0, TODAY_LIMIT)} />{grouped.today.length > TODAY_LIMIT && <p className={styles.moreEvents}>외 {grouped.today.length - TODAY_LIMIT}개</p>}</> : <p className={styles.todayEmpty}>오늘 일정이 없어요</p>}</section>
        <section className={`${styles.scheduleSection} ${styles.tomorrowSection}`}><p className={styles.scheduleLabel}>내일</p>{grouped.tomorrow.length ? <><EventRows events={grouped.tomorrow.slice(0, 3)} />{grouped.tomorrow.length > 3 && <p className={styles.moreEvents}>외 {grouped.tomorrow.length - 3}개</p>}</> : <p className={styles.tomorrowEmpty}>일정 없음</p>}</section>
      </div>
      <section className={styles.upcomingSection}><p className={styles.scheduleLabel}>이후 7일</p>{grouped.upcoming.length > 0 ? <><EventRows events={grouped.upcoming.slice(0, FUTURE_LIMIT)} compact />{grouped.upcoming.length > FUTURE_LIMIT && <p className={styles.moreEvents}>외 {grouped.upcoming.length - FUTURE_LIMIT}개</p>}</> : <p className={styles.upcomingEmpty}>앞으로 예정된 일정이 없어요</p>}</section>
    </div>}
  </Card>;
}
