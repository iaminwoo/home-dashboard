export const COLD_NOW_THRESHOLD = 15;
export const VERY_COLD_NOW_THRESHOLD = 5;
export const TEMP_DROP_THRESHOLD = 6;
export const COOL_LATER_THRESHOLD = 17;
export const HOT_NOW_THRESHOLD = 28;
export const TEMP_RISE_THRESHOLD = 5;
export const HOT_LATER_THRESHOLD = 28;
export const STRONG_WIND_THRESHOLD = 8;
export const RAIN_PROBABILITY_THRESHOLD = 50;

export type WeatherAdviceKind = "rain" | "snow" | "cold" | "wind";

export type WeatherAdvice = {
  kind: WeatherAdviceKind;
  message: string;
};

export type WeatherForecast = {
  dateTime: string;
  temperature: number | null;
  sky: string | null;
  precipitationType: string;
  precipitationProbability: number | null;
  windSpeed: number | null;
};

type TemperatureForecast = WeatherForecast & { temperature: number };

type CurrentWeatherForAdvice = {
  temperature: number;
  precipitationType: string;
  windSpeed: number | null;
};

export function getWindLevel(speed: number | null) {
  if (speed === null || !Number.isFinite(speed)) return null;
  if (speed <= 1.5) return "거의 없음";
  if (speed <= 3.3) return "약함";
  if (speed <= 7.9) return "중간";
  return "강함";
}

function precipitationKind(type: string) {
  if (["3", "7"].includes(type)) return "snow" as const;
  if (["1", "2", "5", "6"].includes(type)) return "rain" as const;
  return null;
}

function precipitationLabel(type: string) {
  const kind = precipitationKind(type);
  if (kind === "snow") return "눈";
  if (type === "2" || type === "6") return "비/눈";
  return kind === "rain" ? "비" : null;
}

function koreaHourLabel(dateTime: string) {
  const hour = Number(dateTime.slice(8, 10));
  if (hour >= 21 || hour < 6) return `밤 ${hour % 12 || 12}시쯤`;
  if (hour >= 18) return `저녁 ${hour % 12 || 12}시쯤`;
  const period = hour < 12 ? "오전" : "오후";
  const twelveHour = hour % 12 || 12;
  return `${period} ${twelveHour}시쯤`;
}

export function getWeatherAdvice(
  current: CurrentWeatherForAdvice,
  forecastToday: WeatherForecast[],
): WeatherAdvice | null {
  const currentPrecipitation = precipitationLabel(current.precipitationType);
  if (currentPrecipitation) {
    return {
      kind: precipitationKind(current.precipitationType) ?? "rain",
      message: `지금 ${currentPrecipitation}가 와요`,
    };
  }

  if (current.temperature <= VERY_COLD_NOW_THRESHOLD) {
    return { kind: "cold", message: "지금 추워요" };
  }

  if (current.temperature <= COLD_NOW_THRESHOLD) {
    return { kind: "cold", message: "지금 쌀쌀해요" };
  }

  if (current.temperature >= HOT_NOW_THRESHOLD) {
    return { kind: "cold", message: "지금 더워요" };
  }

  const upcomingPrecipitation = forecastToday.find(
    (forecast) =>
      precipitationLabel(forecast.precipitationType) ||
      (forecast.precipitationProbability ?? 0) >= RAIN_PROBABILITY_THRESHOLD,
  );
  if (upcomingPrecipitation) {
    const label = precipitationLabel(upcomingPrecipitation.precipitationType) ?? "비";
    const kind = precipitationKind(upcomingPrecipitation.precipitationType) ?? "rain";
    const certainty = precipitationLabel(upcomingPrecipitation.precipitationType) ? "예정" : "가능성";
    return {
      kind,
      message: `${koreaHourLabel(upcomingPrecipitation.dateTime)} ${label} ${certainty}`,
    };
  }

  const temperatureForecasts = forecastToday.filter(
    (forecast): forecast is TemperatureForecast => forecast.temperature !== null,
  );
  const lowestTemperature = temperatureForecasts.reduce<TemperatureForecast | null>(
    (lowest, forecast) => !lowest || forecast.temperature < lowest.temperature ? forecast : lowest,
    null,
  );
  if (
    lowestTemperature !== null &&
    current.temperature - lowestTemperature.temperature >= TEMP_DROP_THRESHOLD &&
    lowestTemperature.temperature <= COOL_LATER_THRESHOLD
  ) {
    const hour = Number(lowestTemperature.dateTime.slice(8, 10));
    return {
      kind: "cold",
      message: hour >= 21 || hour < 6 ? "밤에는 더 추워져요" : "저녁엔 쌀쌀해져요",
    };
  }

  const highestTemperature = temperatureForecasts.reduce<TemperatureForecast | null>(
    (highest, forecast) => !highest || forecast.temperature > highest.temperature ? forecast : highest,
    null,
  );
  if (
    highestTemperature !== null &&
    highestTemperature.temperature - current.temperature >= TEMP_RISE_THRESHOLD &&
    highestTemperature.temperature >= HOT_LATER_THRESHOLD
  ) {
    return { kind: "cold", message: "오후엔 더워져요" };
  }

  if ((current.windSpeed ?? 0) >= STRONG_WIND_THRESHOLD) {
    return { kind: "wind", message: "지금 바람이 강해요" };
  }

  const upcomingStrongWind = forecastToday.find(
    (forecast) => (forecast.windSpeed ?? 0) >= STRONG_WIND_THRESHOLD,
  );
  if (upcomingStrongWind) {
    return {
      kind: "wind",
      message: Number(upcomingStrongWind.dateTime.slice(8, 10)) >= 18
        ? "저녁엔 바람이 강해져요"
        : `${koreaHourLabel(upcomingStrongWind.dateTime)} 바람이 강해져요`,
    };
  }

  return null;
}
