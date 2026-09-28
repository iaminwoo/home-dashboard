"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, calendarDayLabel, calendarShortDayLabel, calendarTime, eventsOnKoreaDate, koreaTodayKey, type CalendarDayEvent, type DashboardCalendarEvent } from "@/lib/calendar-events";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-cards.module.css";

type CardProps = { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string };
function Card({ title, icon, children, className = "" }: CardProps) { return <section className={`${styles.card} ${className}`}><div className={styles.cardHeader}><span className={styles.icon}>{icon}</span><h2>{title}</h2></div>{children}</section>; }

const DAY_EVENT_LIMIT = 3;

function EventRows({ events, compact = false }: { events: CalendarDayEvent[]; compact?: boolean }) {
  return <ol className={compact ? styles.upcomingList : styles.calendarList}>{events.map(({ event, dateKey }) => <li key={`${event.id}-${dateKey}`} className={event.allDay ? styles.allDayEvent : undefined}>{compact && <span className={styles.day}>{calendarDayLabel(dateKey)}</span>}{!event.allDay && <time>{calendarTime(event)}</time>}<strong>{event.summary}</strong></li>)}</ol>;
}

type ScheduleDayProps = {
  dateKey: string;
  label: "오늘" | "내일";
  events: CalendarDayEvent[];
  onOpen: (dateKey: string) => void;
};

function ScheduleDay({ dateKey, label, events, onOpen }: ScheduleDayProps) {
  const shownEvents = events.slice(0, DAY_EVENT_LIMIT);
  const emptyLabel = label === "오늘" ? "오늘 일정이 없어요" : "내일 일정이 없어요";

  return <button type="button" className={`${styles.scheduleSection} ${label === "오늘" ? styles.todaySection : styles.tomorrowSection}`} onClick={() => onOpen(dateKey)} aria-label={`${calendarDayLabel(dateKey)} ${label} 일정 전체 보기`}>
    <span className={styles.scheduleHeading}><strong>{label}</strong></span>
    {events.length ? <>
      <EventRows events={shownEvents} />
      {events.length > DAY_EVENT_LIMIT && <span className={styles.moreEvents}>+{events.length - DAY_EVENT_LIMIT}개</span>}
    </> : <span className={styles.dayEmpty}>{emptyLabel}</span>}
  </button>;
}

function FutureDaySummary({ dateKey, events, onOpen }: { dateKey: string; events: CalendarDayEvent[]; onOpen: (dateKey: string) => void }) {
  const { weekday, day } = calendarShortDayLabel(dateKey);
  const countLabel = events.length ? `${events.length}개` : "없음";

  return <button type="button" className={styles.futureDay} onClick={() => onOpen(dateKey)} aria-label={`${calendarDayLabel(dateKey)} 일정 ${countLabel}, 전체 보기`}>
    <span className={styles.futureDate}><b>{weekday}</b><strong>{day}</strong></span>
    <span className={events.length ? styles.futureCountActive : styles.futureCount}>{countLabel}</span>
  </button>;
}

function ScheduleModal({ dateKey, events, onClose }: { dateKey: string; events: CalendarDayEvent[]; onClose: () => void }) {
  return <div className={styles.scheduleModalOverlay} onClick={onClose}>
    <section className={styles.scheduleModal} role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title" onClick={(event) => event.stopPropagation()}>
      <p>{calendarDayLabel(dateKey)}</p>
      <h3 id="schedule-modal-title">일정 {events.length ? `${events.length}개` : "없음"}</h3>
      {events.length ? <EventRows events={events} /> : <span className={styles.modalEmpty}>이 날은 일정이 없어요</span>}
      <span className={styles.modalHint}>바깥을 누르면 닫혀요</span>
    </section>
  </div>;
}

export function CalendarCard() {
  const [events, setEvents] = useState<DashboardCalendarEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
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

  useEffect(() => {
    if (!selectedDateKey) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDateKey(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedDateKey]);

  const grouped = useMemo(() => {
    const today = koreaTodayKey();
    const tomorrow = addDays(today, 1);
    const allEvents = events ?? [];
    const futureDays = Array.from({ length: 5 }, (_, index) => {
      const dateKey = addDays(today, index + 2);
      return { dateKey, events: eventsOnKoreaDate(allEvents, dateKey) };
    });
    return { today, tomorrow, todayEvents: eventsOnKoreaDate(allEvents, today), tomorrowEvents: eventsOnKoreaDate(allEvents, tomorrow), futureDays };
  }, [events]);

  const selectedEvents = selectedDateKey ? eventsOnKoreaDate(events ?? [], selectedDateKey) : [];

  return <Card title="일정" icon={<DashboardIcon name="calendar" />} className={styles.calendarCard}>
    {error ? <div className={styles.calendarEmpty}><strong>일정을 불러오지 못했어요</strong><span>연결 설정과 네트워크를 확인해 주세요.</span></div> : events === null ? <div className={styles.calendarEmpty}><strong>일정을 불러오는 중이에요</strong></div> : <div className={styles.calendarContent}>
      <div className={styles.scheduleTopGrid}>
        <ScheduleDay dateKey={grouped.today} label="오늘" events={grouped.todayEvents} onOpen={setSelectedDateKey} />
        <ScheduleDay dateKey={grouped.tomorrow} label="내일" events={grouped.tomorrowEvents} onOpen={setSelectedDateKey} />
      </div>
      <section className={styles.upcomingSection} aria-label="모레부터 이후 5일 일정 요약">{grouped.futureDays.map(({ dateKey, events: dayEvents }) => <FutureDaySummary key={dateKey} dateKey={dateKey} events={dayEvents} onOpen={setSelectedDateKey} />)}</section>
    </div>}
    {selectedDateKey && <ScheduleModal dateKey={selectedDateKey} events={selectedEvents} onClose={() => setSelectedDateKey(null)} />}
  </Card>;
}
