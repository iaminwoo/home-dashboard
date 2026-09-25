type DashboardIconName = "weather-clear" | "weather-cloud" | "weather-rain" | "weather-snow" | "parking" | "calendar" | "checklist" | "pin" | "wifi" | "more";

export function DashboardIcon({ name }: { name: DashboardIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "weather-clear") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.4" {...common} /><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" {...common} /></svg>;
  if (name === "weather-cloud") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 18h10.1a3.8 3.8 0 0 0 .5-7.5 5.3 5.3 0 0 0-10-1.7A4.6 4.6 0 0 0 6.4 18Z" {...common} /></svg>;
  if (name === "weather-rain") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 16.2h9.1a3.7 3.7 0 0 0 .5-7.4A5.2 5.2 0 0 0 7 7.3a4.4 4.4 0 0 0 .2 8.9Z" {...common} /><path d="m8.5 19-1 2M12.5 19l-1 2M16.5 19l-1 2" {...common} /></svg>;
  if (name === "weather-snow") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 15.6h9.1a3.7 3.7 0 0 0 .5-7.4A5.2 5.2 0 0 0 7 6.7a4.4 4.4 0 0 0 .2 8.9Z" {...common} /><path d="M12 18v4M10.3 19l3.4 2M13.7 19l-3.4 2" {...common} /></svg>;
  if (name === "parking") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 15.5v-3.1l2-1.1 1.8-3.4h6.9l2.2 3.4 2.1 1.1v3.1" {...common} /><path d="M3.5 15.5h17M6.3 15.5a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM17.7 15.5a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM8.6 11.3h5.1M3.5 12.4h17" {...common} /></svg>;
  if (name === "calendar") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="5.5" width="15" height="14" rx="2" {...common} /><path d="M8 3.5v4M16 3.5v4M4.5 10h15M8 14h.1M12 14h.1M16 14h.1" {...common} /></svg>;
  if (name === "pin") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.1 6-11.1a6 6 0 1 0-12 0C6 15.9 12 21 12 21Z" {...common} /><circle cx="12" cy="9.8" r="2" {...common} /></svg>;
  if (name === "wifi") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.3a12.1 12.1 0 0 1 17 0M6.7 12.5a7.5 7.5 0 0 1 10.6 0M9.9 15.7a3 3 0 0 1 4.2 0" {...common} /><path d="M12 19.5h.01" {...common} /></svg>;
  if (name === "more") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7.2" {...common} /></svg>;
}
