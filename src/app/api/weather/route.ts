const KMA_ENDPOINT =
  "https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getUltraSrtNcst";
const ILSAN_PUNGDONG_GRID = { nx: 57, ny: 129 };

type KmaItem = { category: string; obsrValue: string };

function getKoreaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
  };
}

function latestObservationBase(now: Date) {
  const korea = getKoreaDateParts(now);
  // 초단기실황은 정시 관측 자료가 약 10분 뒤 제공됩니다.
  // 매시 00~09분에는 직전 정시를, 10분부터는 현재 정시를 요청합니다.
  const base = new Date(
    Date.UTC(
      korea.year,
      korea.month - 1,
      korea.day,
      korea.hour - (korea.minute >= 10 ? 0 : 1),
    ),
  );
  const date = `${base.getUTCFullYear()}${String(base.getUTCMonth() + 1).padStart(2, "0")}${String(base.getUTCDate()).padStart(2, "0")}`;
  const time = `${String(base.getUTCHours()).padStart(2, "0")}00`;
  return { date, time };
}

function precipitationLabel(value: string | undefined) {
  const labels: Record<string, string> = {
    "0": "강수 없음",
    "1": "비",
    "2": "비/눈",
    "3": "눈",
    "5": "빗방울",
    "6": "빗방울/눈날림",
    "7": "눈날림",
  };
  return labels[value ?? "0"] ?? "관측 중";
}

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey)
    return Response.json(
      { error: "KMA_API_KEY가 설정되지 않았습니다." },
      { status: 503 },
    );

  const base = latestObservationBase(new Date());
  const url = new URL(KMA_ENDPOINT);
  for (const [key, value] of Object.entries({
    authKey: apiKey,
    pageNo: "1",
    numOfRows: "10",
    dataType: "JSON",
    base_date: base.date,
    base_time: base.time,
    nx: String(ILSAN_PUNGDONG_GRID.nx),
    ny: String(ILSAN_PUNGDONG_GRID.ny),
  }))
    url.searchParams.set(key, value);

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`기상청 응답 상태: ${response.status}`);
    const payload = await response.json();
    const header = payload?.response?.header;
    if (header?.resultCode !== "00")
      throw new Error(header?.resultMsg ?? "기상청 요청에 실패했습니다.");

    const items = (payload?.response?.body?.items?.item ?? []) as KmaItem[];
    const values = Object.fromEntries(
      items.map((item) => [item.category, item.obsrValue]),
    );
    if (!values.T1H) throw new Error("기온 관측값이 없습니다.");

    return Response.json(
      {
        temperature: Number(values.T1H),
        precipitation: precipitationLabel(values.PTY),
        precipitationType: values.PTY ?? "0",
        rainfall: values.RN1 ?? "강수없음",
        humidity: values.REH ? Number(values.REH) : null,
        windSpeed: values.WSD ? Number(values.WSD) : null,
        observedAt: `${base.date.slice(0, 4)}.${base.date.slice(4, 6)}.${base.date.slice(6, 8)} ${base.time.slice(0, 2)}:00`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("KMA ultra-short observation request failed", error);
    return Response.json(
      { error: "기상청 실황을 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
