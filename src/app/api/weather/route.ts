import {
  getWeatherAdvice,
  getWindLevel,
  type WeatherForecast,
} from "@/lib/weather";

const KMA_BASE_URL =
  "https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0";
const ILSAN_PUNGDONG_GRID = { nx: 57, ny: 129 };

type KmaObservationItem = { category: string; obsrValue: string };
type KmaForecastItem = {
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
};

type KoreaDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getKoreaDateParts(date: Date): KoreaDateParts {
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

function formatKmaBase(date: Date) {
  return {
    date: `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`,
    time: `${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}`,
  };
}

function latestObservationBase(now: Date) {
  const korea = getKoreaDateParts(now);
  // 초단기실황은 정시 관측 자료가 약 10분 뒤 제공됩니다.
  const base = new Date(
    Date.UTC(korea.year, korea.month - 1, korea.day, korea.hour - (korea.minute >= 10 ? 0 : 1)),
  );
  return formatKmaBase(base);
}

function latestUltraForecastBase(now: Date) {
  const korea = getKoreaDateParts(now);
  // 초단기예보는 매시 30분 발표 후 약 15분 뒤부터 안정적으로 조회합니다.
  const base = new Date(
    Date.UTC(korea.year, korea.month - 1, korea.day, korea.hour - (korea.minute >= 45 ? 0 : 1), 30),
  );
  return formatKmaBase(base);
}

function latestShortForecastBase(now: Date) {
  const korea = getKoreaDateParts(now);
  const releaseHours = [2, 5, 8, 11, 14, 17, 20, 23];
  const latestHour = [...releaseHours]
    .reverse()
    .find((hour) => korea.hour > hour || (korea.hour === hour && korea.minute >= 10));
  const base = new Date(
    Date.UTC(korea.year, korea.month - 1, korea.day, latestHour ?? -1),
  );
  return formatKmaBase(base);
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

async function fetchKmaItems<T>(
  endpoint: string,
  base: { date: string; time: string },
  apiKey: string,
): Promise<T[]> {
  const url = new URL(`${KMA_BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries({
    authKey: apiKey,
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: base.date,
    base_time: base.time,
    nx: String(ILSAN_PUNGDONG_GRID.nx),
    ny: String(ILSAN_PUNGDONG_GRID.ny),
  })) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`기상청 응답 상태: ${response.status}`);
  const payload = await response.json();
  const header = payload?.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(header?.resultMsg ?? "기상청 요청에 실패했습니다.");
  }
  return (payload?.response?.body?.items?.item ?? []) as T[];
}

function numberOrNull(value: string | undefined) {
  if (value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeForecast(items: KmaForecastItem[]): WeatherForecast[] {
  const grouped = new Map<string, Record<string, string>>();
  for (const item of items) {
    const dateTime = `${item.fcstDate}${item.fcstTime}`;
    const values = grouped.get(dateTime) ?? {};
    values[item.category] = item.fcstValue;
    grouped.set(dateTime, values);
  }

  return [...grouped.entries()]
    .map(([dateTime, values]) => ({
      dateTime,
      temperature: numberOrNull(values.T1H ?? values.TMP),
      sky: values.SKY ?? null,
      precipitationType: values.PTY ?? "0",
      precipitationProbability: numberOrNull(values.POP),
      windSpeed: numberOrNull(values.WSD),
    }))
    .sort((left, right) => left.dateTime.localeCompare(right.dateTime));
}

function mergeForecasts(
  ultraShort: WeatherForecast[],
  short: WeatherForecast[],
  now: Date,
) {
  const korea = getKoreaDateParts(now);
  const today = `${korea.year}${String(korea.month).padStart(2, "0")}${String(korea.day).padStart(2, "0")}`;
  const nowKey = `${today}${String(korea.hour).padStart(2, "0")}${String(korea.minute).padStart(2, "0")}`;
  const byDateTime = new Map<string, WeatherForecast>();

  for (const forecast of short) byDateTime.set(forecast.dateTime, forecast);
  for (const forecast of ultraShort) {
    const existing = byDateTime.get(forecast.dateTime);
    byDateTime.set(forecast.dateTime, {
      ...existing,
      ...forecast,
      temperature: forecast.temperature ?? existing?.temperature ?? null,
      precipitationProbability:
        forecast.precipitationProbability ?? existing?.precipitationProbability ?? null,
      windSpeed: forecast.windSpeed ?? existing?.windSpeed ?? null,
      sky: forecast.sky ?? existing?.sky ?? null,
    });
  }

  return [...byDateTime.values()]
    .filter((forecast) => forecast.dateTime >= nowKey && forecast.dateTime <= `${today}2359`)
    .sort((left, right) => left.dateTime.localeCompare(right.dateTime));
}

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "KMA_API_KEY가 설정되지 않았습니다." }, { status: 503 });
  }

  const now = new Date();
  try {
    const observationItems = await fetchKmaItems<KmaObservationItem>(
      "getUltraSrtNcst",
      latestObservationBase(now),
      apiKey,
    );
    const values = Object.fromEntries(
      observationItems.map((item) => [item.category, item.obsrValue]),
    );
    const temperature = numberOrNull(values.T1H);
    if (temperature === null) throw new Error("기온 관측값이 없습니다.");

    const [ultraShortResult, shortResult] = await Promise.allSettled([
      fetchKmaItems<KmaForecastItem>("getUltraSrtFcst", latestUltraForecastBase(now), apiKey),
      fetchKmaItems<KmaForecastItem>("getVilageFcst", latestShortForecastBase(now), apiKey),
    ]);
    if (ultraShortResult.status === "rejected") {
      console.warn("KMA ultra-short forecast request failed", ultraShortResult.reason);
    }
    if (shortResult.status === "rejected") {
      console.warn("KMA short forecast request failed", shortResult.reason);
    }

    const forecastToday = mergeForecasts(
      ultraShortResult.status === "fulfilled" ? normalizeForecast(ultraShortResult.value) : [],
      shortResult.status === "fulfilled" ? normalizeForecast(shortResult.value) : [],
      now,
    );
    const windSpeed = numberOrNull(values.WSD);
    const precipitationType = values.PTY ?? "0";

    return Response.json(
      {
        temperature,
        precipitation: precipitationLabel(precipitationType),
        precipitationType,
        sky: forecastToday[0]?.sky ?? null,
        rainfall: values.RN1 ?? "강수없음",
        humidity: numberOrNull(values.REH),
        windSpeed,
        windLevel: getWindLevel(windSpeed),
        observedAt: latestObservationBase(now),
        forecastToday,
        advice: getWeatherAdvice({ temperature, precipitationType, windSpeed }, forecastToday),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("KMA ultra-short observation request failed", error);
    return Response.json({ error: "기상청 실황을 불러오지 못했습니다." }, { status: 502 });
  }
}
