export type DashboardCalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
};

export type CalendarDayEvent = {
  event: DashboardCalendarEvent;
  dateKey: string;
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

export function eventOccursOnKoreaDate(
  event: DashboardCalendarEvent,
  targetDate: string,
) {
  if (event.allDay) {
    const endDate = event.end || addDays(event.start, 1);
    return event.start <= targetDate && targetDate < endDate;
  }

  const dayStart = new Date(`${targetDate}T00:00:00+09:00`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  return eventStart < dayEnd && eventEnd > dayStart;
}

export function eventsOnKoreaDate(
  events: DashboardCalendarEvent[],
  dateKey: string,
): CalendarDayEvent[] {
  return events
    .filter((event) => eventOccursOnKoreaDate(event, dateKey))
    .map((event) => ({ event, dateKey }));
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
    weekday: "long",
  }).format(date);
  return `${Number(part("month"))}/${Number(part("day"))} ${weekday}`;
}
