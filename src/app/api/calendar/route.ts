import { getUpcomingCalendarEvents } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const events = await getUpcomingCalendarEvents();
    return Response.json({ events }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Google Calendar request failed", error);
    return Response.json({ error: "일정을 불러오지 못했습니다." }, { status: 502 });
  }
}
