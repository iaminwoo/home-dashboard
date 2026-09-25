"use client";

import { useEffect, useState } from "react";
import type { WeatherAdvice, WeatherForecast } from "@/lib/weather";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-cards.module.css";

type Weather = {
  temperature: number;
  precipitation: string;
  precipitationType: string;
  sky: string | null;
  rainfall: string;
  humidity: number | null;
  windSpeed: number | null;
  windLevel: string | null;
  observedAt: string;
  forecastToday: WeatherForecast[];
  advice: WeatherAdvice | null;
};

const windLevelSteps: Record<string, number> = {
  "거의 없음": 1,
  약함: 2,
  중간: 3,
  강함: 4,
};

function adviceIcon(advice: WeatherAdvice) {
  if (advice.kind === "snow") return "weather-snow" as const;
  if (advice.kind === "rain") return "weather-rain" as const;
  return "weather-clear" as const;
}

function currentWeatherIcon(precipitationType: string, sky: string | null) {
  if (["3", "7"].includes(precipitationType)) return "weather-snow" as const;
  if (["1", "2", "5", "6"].includes(precipitationType)) return "weather-rain" as const;
  if (["3", "4"].includes(sky ?? "")) return "weather-cloud" as const;
  return "weather-clear" as const;
}

export function WeatherCard() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" });
        if (!response.ok) throw new Error("Weather request failed");
        const data = (await response.json()) as Weather;
        if (active) {
          setWeather(data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    };
    void load();
    const timer = window.setInterval(load, 5 * 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className={`${styles.card} ${styles.weatherCard}`}>
      {weather ? (
        <>
          <div className={styles.weatherMain}>
            <strong>{Math.round(weather.temperature)}°</strong>
            <div className={styles.weatherStats}>
              <div className={styles.weatherMeasurements}>
                <span className={styles.weatherCondition}>
                  날씨
                  <span className={styles.weatherCurrentIcon}><DashboardIcon name={currentWeatherIcon(weather.precipitationType, weather.sky)} /></span>
                </span>
                <span>습도 <b>{weather.humidity ?? "-"}%</b></span>
                <span className={styles.windReading}>
                  바람
                  <span className={styles.windBars} role="img" aria-label={`바람 ${weather.windLevel ?? "정보 없음"}`}>
                    {Array.from({ length: 4 }, (_, index) => (
                      <i
                        key={index}
                        className={index < (windLevelSteps[weather.windLevel ?? ""] ?? 0) ? styles.windBarActive : styles.windBar}
                      />
                    ))}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className={styles.weatherDetails}>
            <span className={styles.weatherIcon}><DashboardIcon name={weather.advice ? adviceIcon(weather.advice) : "weather-clear"} /></span>
            <b>{weather.advice?.message ?? "좋은 하루 되세요!"}</b>
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <strong>
            {error ? "날씨를 불러오지 못했어요" : "날씨를 불러오는 중이에요"}
          </strong>
          <span>
            {error
              ? "인증키와 네트워크 연결을 확인해 주세요."
              : "기상청 초단기실황을 확인하고 있습니다."}
          </span>
        </div>
      )}
    </section>
  );
}
