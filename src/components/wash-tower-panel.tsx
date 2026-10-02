import type {
  WashTowerApplianceStatus,
  WashTowerStatus,
} from "@/lib/thinq/types";
import styles from "./dashboard-cards.module.css";

type ApplianceKind = "washer" | "dryer";
type ApplianceVisualState =
  | "off"
  | "ready"
  | "running"
  | "spinning"
  | "complete"
  | "unknown";
type WashTowerPanelProps = {
  status: WashTowerStatus | null;
  loading: boolean;
  error: string | null;
};

function applianceDisplay(
  kind: ApplianceKind,
  appliance: WashTowerApplianceStatus,
) {
  const state = appliance.state;
  if (state === "POWER_OFF")
    return { label: "꺼짐", visualState: "off" as const };
  if (state === "PAUSE")
    return { label: "일시정지", visualState: "ready" as const };
  if (state === "ERROR")
    return { label: "오류", visualState: "ready" as const };

  if (kind === "washer") {
    if (state === "INITIAL")
      return { label: "세탁기 켜짐", visualState: "ready" as const };
    if (state === "DETECTING" || state === "RUNNING")
      return { label: "세탁 중", visualState: "running" as const };
    if (state === "RINSING")
      return { label: "헹굼 중", visualState: "running" as const };
    if (state === "SPINNING")
      return { label: "탈수 중", visualState: "spinning" as const };
    if (state === "END")
      return { label: "세탁 완료", visualState: "complete" as const };
  } else {
    if (state === "INITIAL")
      return { label: "건조기 켜짐", visualState: "ready" as const };
    if (state === "DETECTING" || state === "RUNNING")
      return { label: "건조 중", visualState: "running" as const };
    if (state === "END")
      return { label: "건조 완료", visualState: "complete" as const };
    if (state === "WRINKLE_CARE")
      return { label: "주름방지", visualState: "running" as const };
  }
  return {
    label: state === null ? "상태 확인 중" : "워시타워 동작 중",
    visualState: "unknown" as const,
  };
}

function formatRemainingMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${minutes}분 남음`;
  return remainder === 0
    ? `${hours}시간 남음`
    : `${hours}시간 ${remainder}분 남음`;
}

function ApplianceSvg({
  kind,
  state,
}: {
  kind: ApplianceKind;
  state: ApplianceVisualState;
}) {
  return (
    <svg
      className={styles.applianceSvg}
      data-kind={kind}
      data-state={state}
      viewBox="0 0 120 150"
      aria-hidden="true"
    >
      <g className={styles.machineShake}>
        <rect
          className={styles.machineCase}
          x="16"
          y="8"
          width="88"
          height="132"
          rx="11"
        />
        <rect
          className={styles.machinePanel}
          x="24"
          y="18"
          width="72"
          height="20"
          rx="4"
        />
        <circle className={styles.machineDisplay} cx="37" cy="28" r="4" />
        <path className={styles.machineScreen} d="M49 28h22" />
        <circle className={styles.machineLight} cx="86" cy="28" r="3" />
        <circle className={styles.doorOuter} cx="60" cy="88" r="34" />
        <circle className={styles.doorInner} cx="60" cy="88" r="26" />
        <g className={styles.drumSpin}>
          <path className={styles.drumHighlight} d="M60 66c12 0 22 10 22 22" />
          <path
            className={styles.drumHighlight}
            d="M60 110c-12 0-22-10-22-22"
          />
          <path
            className={styles.washerPattern}
            d="M48 88c4-7 8 7 12 0s8 7 12 0"
          />
          <path
            className={styles.dryerPattern}
            d="M49 78c4 3 7 3 11 0s7-3 11 0M49 98c4 3 7 3 11 0s7-3 11 0"
          />
        </g>
        <path className={styles.machineBase} d="M26 140h68" />
        <path className={styles.completeMark} d="m53 88 5 5 10-11" />
      </g>
    </svg>
  );
}

function ApplianceCard({
  kind,
  appliance,
}: {
  kind: ApplianceKind;
  appliance: WashTowerApplianceStatus;
}) {
  const display = applianceDisplay(kind, appliance);

  return (
    <article className={styles.applianceCard}>
      <h3>{kind === "washer" ? "세탁기" : "건조기"}</h3>
      <div className={styles.applianceBody}>
        <ApplianceSvg kind={kind} state={display.visualState} />
        <div className={styles.applianceInfo}>
          <strong>{display.label}</strong>
          {appliance.remainingMinutes !== null &&
            appliance.remainingMinutes > 0 && (
              <span>{formatRemainingMinutes(appliance.remainingMinutes)}</span>
            )}
        </div>
      </div>
    </article>
  );
}

export function WashTowerPanel({
  status,
  loading,
  error,
}: WashTowerPanelProps) {
  const actualStatus = status ?? {
    washer: { state: null, remainingMinutes: null },
    dryer: { state: null, remainingMinutes: null },
    fetchedAt: "",
  };
  const helperMessage = !status
    ? error
      ? "상태를 불러오지 못했습니다"
      : loading
        ? "워시타워 상태를 확인하고 있어요"
        : null
    : null;

  return (
    <div className={styles.washTowerPanel}>
      <div className={styles.applianceGrid} aria-live="polite">
        <ApplianceCard kind="washer" appliance={actualStatus.washer} />
        <ApplianceCard kind="dryer" appliance={actualStatus.dryer} />
      </div>
      {helperMessage && (
        <p className={styles.washTowerHelper}>{helperMessage}</p>
      )}
    </div>
  );
}
