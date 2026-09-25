"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./clock.module.css";

type QuickInfo = "address" | "wifi" | "other" | null;
const homeAddress = process.env.NEXT_PUBLIC_HOME_ADDRESS?.replace(/\\n/g, "\n").trim();

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  const [quickInfo, setQuickInfo] = useState<QuickInfo>(null);
  const [qrAvailable, setQrAvailable] = useState(true);

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
        <button type="button" onClick={() => setQuickInfo("other")}>
          <DashboardIcon name="more" />
          <span>기타</span>
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
            className={styles.modal}
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
            {quickInfo === "other" && (
              <>
                <p className={styles.modalLabel}>기타</p>
                <h2 id="quick-info-title">준비 중이에요</h2>
                <p className={styles.modalHint}>
                  이 공간에는 나중에 필요한 정보를 추가할 수 있어요.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
