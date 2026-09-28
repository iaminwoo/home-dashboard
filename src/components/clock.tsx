"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { autoThemeSchedule, dashboardThemeNames, dashboardThemes, getAutoTheme, type ThemeMode } from "@/lib/dashboard-theme";
import { DashboardIcon } from "./dashboard-icon";
import { useDashboardTheme } from "./theme-provider";
import styles from "./clock.module.css";

type QuickInfo = "address" | "wifi" | "theme" | null;
const homeAddress = process.env.NEXT_PUBLIC_HOME_ADDRESS?.replace(/\\n/g, "\n").trim();

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  const [quickInfo, setQuickInfo] = useState<QuickInfo>(null);
  const [qrAvailable, setQrAvailable] = useState(true);
  const { themeMode, setThemeMode } = useDashboardTheme();

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuickInfo(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  if (!now)
    return <div className={styles.loading} aria-label="시간 불러오는 중" />;

  const parts = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const date = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
  const autoTheme = dashboardThemes[getAutoTheme()];
  const chooseTheme = (mode: ThemeMode) => { setThemeMode(mode); setQuickInfo(null); };

  return (
    <div className={styles.clock}>
      <div className={styles.quickActions}>
        <button type="button" onClick={() => setQuickInfo("address")}>
          <DashboardIcon name="pin" />
          <span>주소</span>
        </button>
        <button type="button" onClick={() => setQuickInfo("wifi")}>
          <DashboardIcon name="wifi" />
          <span>Wi‑Fi</span>
        </button>
        <button type="button" onClick={() => setQuickInfo("theme")}>
          <DashboardIcon name="palette" />
          <span>테마</span>
        </button>
      </div>
      <div className={styles.timeBlock}>
        <div className={styles.timeDisplay}>
          <p className={styles.period}>{part("dayPeriod")}</p>
          <time className={styles.time}>
            {part("hour")}:{part("minute")}
          </time>
        </div>
        <p className={styles.date}>{date}</p>
      </div>
      {quickInfo && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setQuickInfo(null)}
        >
          <section
            className={`${styles.modal} ${quickInfo === "wifi" ? styles.wifiModal : ""} ${quickInfo === "theme" ? styles.themeModal : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-info-title"
            onClick={(event) => event.stopPropagation()}
          >
            {quickInfo === "address" && (
              <>
                <p className={styles.modalLabel}>우리 집 주소</p>
                <h2 id="quick-info-title" className={styles.address}>
                  {homeAddress || "NEXT_PUBLIC_HOME_ADDRESS를 설정해 주세요"}
                </h2>
              </>
            )}
            {quickInfo === "wifi" && (
              <>
                <p className={styles.modalLabel}>Wi‑Fi 연결</p>
                <h2 id="quick-info-title" className={styles.wifiTitle}>
                  QR 코드를 스캔하세요
                </h2>
                {qrAvailable ? (
                  <Image
                    className={styles.qrImage}
                    src="/wifi-qr.jpeg"
                    alt="Wi-Fi 연결 QR 코드"
                    width={350}
                    height={350}
                    onError={() => setQrAvailable(false)}
                  />
                ) : (
                  <p className={styles.modalHint}>
                    <code>public/wifi-qr.jpeg</code> 파일을 추가해 주세요.
                  </p>
                )}
              </>
            )}
            {quickInfo === "theme" && (
              <>
                <h2 id="quick-info-title" className={styles.themeTitle}>테마</h2>
                <div className={styles.themeOptions} role="radiogroup" aria-label="대시보드 테마">
                  <div className={styles.autoThemeSection}>
                    <button type="button" className={`${styles.themeOption} ${themeMode === "auto" ? styles.themeOptionSelected : ""}`} role="radio" aria-checked={themeMode === "auto"} onClick={() => chooseTheme("auto")}>
                      <span className={styles.themePreview} aria-hidden="true"><i style={{ background: autoTheme.preview.background }} /><i style={{ background: autoTheme.preview.dot }} /><i style={{ background: autoTheme.preview.accent }} /></span>
                      <span>자동</span>
                      <span className={styles.themeRadio}>{themeMode === "auto" ? "✓" : ""}</span>
                    </button>
                    <p className={styles.autoThemeDescription}>시간대에 따라 자동으로 변경됩니다.</p>
                    <div className={styles.autoThemeSchedule} aria-label="자동 테마 시간표">
                      {autoThemeSchedule.map((rule) => <div key={rule.label}><span>{rule.label}</span><strong>{dashboardThemes[rule.theme].label}</strong></div>)}
                    </div>
                  </div>
                  <div className={styles.themeDivider} aria-hidden="true" />
                  <p className={styles.manualThemeLabel}>직접 선택</p>
                  {dashboardThemeNames.map((themeName) => {
                    const theme = dashboardThemes[themeName];
                    const selected = themeMode === themeName;
                    return <button key={themeName} type="button" className={`${styles.themeOption} ${selected ? styles.themeOptionSelected : ""}`} role="radio" aria-checked={selected} onClick={() => chooseTheme(themeName)}>
                      <span className={styles.themePreview} aria-hidden="true"><i style={{ background: theme.preview.background }} /><i style={{ background: theme.preview.dot }} /><i style={{ background: theme.preview.accent }} /></span>
                      <span>{theme.label}</span>
                      <span className={styles.themeRadio}>{selected ? "✓" : ""}</span>
                    </button>;
                  })}
                </div>
              </>
            )}
            <p className={styles.dismissHint}>바깥을 누르면 닫혀요</p>
          </section>
        </div>
      )}
    </div>
  );
}
