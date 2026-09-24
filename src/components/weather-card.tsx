"use client";

import { useEffect, useState } from "react";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-cards.module.css";

type Weather = {
  temperature: number;
  precipitation: string;
  precipitationType: string;
  rainfall: string;
  humidity: number | null;
  windSpeed: number | null;
  observedAt: string;
};

function weatherIcon(precipitationType: string) {
  if (["1", "2", "5", "6"].includes(precipitationType)) return "weather-rain" as const;
  if (["3", "7"].includes(precipitationType)) return "weather-snow" as const;
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
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.icon}><DashboardIcon name={weather ? weatherIcon(weather.precipitationType) : "weather-clear"} /></span>
        <h2>날씨</h2>
      </div>
      {weather ? (
        <>
          <div className={styles.weatherMain}>
            <strong>{Math.round(weather.temperature)}°</strong>
            <div><b>{weather.precipitation}</b><span className={styles.weatherMetrics}>습도 {weather.humidity ?? "-"}% <i /> 바람 {weather.windSpeed ?? "-"}m/s</span></div>
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
