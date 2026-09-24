export type DashboardCalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
};

export function koreaDateKey(value: string, allDay = false) {
  if (allDay) return value.slice(0, 10);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function koreaTodayKey(now = new Date()) {
  return koreaDateKey(now.toISOString());
}

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return koreaDateKey(date.toISOString());
}

export function calendarTime(event: DashboardCalendarEvent) {
  if (event.allDay) return "종일";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(event.start));
}

export function calendarDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00+09:00`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(date);
  return `${Number(part("month"))}/${Number(part("day"))} ${weekday}`;
}
