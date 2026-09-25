import { google } from "googleapis";
import type { DashboardCalendarEvent } from "./calendar-events";

function calendarClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);

  if (!email || !privateKey) {
    throw new Error("Google Calendar 서비스 계정 환경변수가 설정되지 않았습니다.");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  return google.calendar({ version: "v3", auth });
}

function normalizePrivateKey(value: string | undefined) {
  if (!value) return undefined;

  const normalized = value.replace(/\\n/g, "\n");
  const begin = "-----BEGIN PRIVATE KEY-----";
  const end = "-----END PRIVATE KEY-----";
  const startIndex = normalized.indexOf(begin);
  const endIndex = normalized.indexOf(end, startIndex);

  if (startIndex === -1 || endIndex === -1) return normalized.trim();
  return `${normalized.slice(startIndex, endIndex + end.length).trim()}\n`;
}

export async function getUpcomingCalendarEvents(now = new Date()) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID가 설정되지 않았습니다.");

  const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const response = await calendarClient().events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    showDeleted: false,
    maxResults: 100,
  });

  return (response.data.items ?? [])
    .filter((event) => event.status !== "cancelled" && (event.start?.dateTime || event.start?.date))
    .map((event): DashboardCalendarEvent => {
      const allDay = Boolean(event.start?.date);
      return {
        id: event.id ?? `${event.start?.dateTime ?? event.start?.date}-${event.summary ?? "untitled"}`,
        summary: event.summary?.trim() || "제목 없는 일정",
        start: event.start?.dateTime ?? event.start?.date ?? "",
        end: event.end?.dateTime ?? event.end?.date ?? "",
        allDay,
      };
    });
}
