export type ThemeName = "pink" | "warm" | "cool";
export type ThemeMode = "auto" | ThemeName;

type ThemeDefinition = {
  label: string;
  preview: { background: string; dot: string; accent: string };
  variables: Record<string, string>;
};

export const DASHBOARD_THEME_STORAGE_KEY = "dashboard-theme-mode";

export const dashboardThemes: Record<ThemeName, ThemeDefinition> = {
  pink: {
    label: "Pink",
    preview: { background: "#f8dcdd", dot: "#d94a57", accent: "#d94a57" },
    variables: {
      "--background": "#f8dcdd", "--surface": "#f8dcdd", "--surface-soft": "#fceeee", "--card": "#fff8f8", "--ink": "#2e2a2a", "--muted": "#746868", "--accent": "#d94a57", "--accent-strong": "#c83b49", "--accent-soft": "#f7d8dc", "--line": "#edd7d8", "--dot-color": "rgb(217 74 87 / 33%)", "--clock-time": "#2b2324", "--text-subtle-warm": "#8c6f73", "--pattern-text": "#d94a57", "--pattern-text-shadow": "none", "--surface-emphasis": "#ffeff1", "--surface-neutral": "#fff5f4", "--surface-future": "#fff3f3", "--surface-active": "#f9e5e7", "--text-muted-soft": "#9b898a", "--checkbox-border": "#af9699", "--overlay": "rgb(46 42 42 / 88%)", "--home-marker": "#e99ba3",
    },
  },
  warm: {
    label: "Warm",
    preview: { background: "#f6f0e8", dot: "#c96f4a", accent: "#c96f4a" },
    variables: {
      "--background": "#f6f0e8", "--surface": "#f6f0e8", "--surface-soft": "#f8ebe4", "--card": "#fffdf9", "--ink": "#302b28", "--muted": "#756864", "--accent": "#c96f4a", "--accent-strong": "#b95c3f", "--accent-soft": "#f4e3da", "--line": "#e8d8ce", "--dot-color": "rgb(201 111 74 / 27%)", "--clock-time": "#2b2623", "--text-subtle-warm": "#8b716a", "--pattern-text": "#c96f4a", "--pattern-text-shadow": "none", "--surface-emphasis": "#fff1e9", "--surface-neutral": "#fff8f2", "--surface-future": "#fdf4ec", "--surface-active": "#f8e6da", "--text-muted-soft": "#9d8b84", "--checkbox-border": "#b49a91", "--overlay": "rgb(48 40 35 / 88%)", "--home-marker": "#df9c80",
    },
  },
  cool: {
    label: "Cool",
    preview: { background: "#ddecf0", dot: "#4e8492", accent: "#4e8492" },
    variables: {
      "--background": "#ddecf0", "--surface": "#ddecf0", "--surface-soft": "#eaf5f7", "--card": "#fbfefe", "--ink": "#263238", "--muted": "#66767b", "--accent": "#4e8492", "--accent-strong": "#3f7280", "--accent-soft": "#d7e8ec", "--line": "#c9dce1", "--dot-color": "rgb(78 132 146 / 28%)", "--clock-time": "#223034", "--text-subtle-warm": "#65777c", "--pattern-text": "#4e8492", "--pattern-text-shadow": "none", "--surface-emphasis": "#edf8fa", "--surface-neutral": "#f4fafb", "--surface-future": "#eef7f8", "--surface-active": "#deeff2", "--text-muted-soft": "#8a9a9f", "--checkbox-border": "#96abb1", "--overlay": "rgb(35 50 55 / 88%)", "--home-marker": "#82adb7",
    },
  },
};

export const dashboardThemeNames = Object.keys(dashboardThemes) as ThemeName[];

export const autoThemeSchedule = [
  { startHour: 0, endHour: 12, label: "00:00–11:59", theme: "cool" },
  { startHour: 12, endHour: 16, label: "12:00–15:59", theme: "pink" },
  { startHour: 16, endHour: 21, label: "16:00–20:59", theme: "warm" },
  { startHour: 21, endHour: 24, label: "21:00–23:59", theme: "cool" },
] as const satisfies ReadonlyArray<{
  startHour: number;
  endHour: number;
  label: string;
  theme: ThemeName;
}>;

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "auto" || dashboardThemeNames.includes(value as ThemeName);
}

export function getAutoTheme(context?: { hour?: number; weather?: string }): ThemeName {
  const hour = context?.hour ?? new Date().getHours();

  void context?.weather;

  return autoThemeSchedule.find(
    (rule) => hour >= rule.startHour && hour < rule.endHour,
  )?.theme ?? "cool";
}

export function getNextAutoThemeTransition(now = new Date()): Date {
  const nextTransition = new Date(now);
  const hour = now.getHours();
  const currentRule = autoThemeSchedule.find(
    (rule) => hour >= rule.startHour && hour < rule.endHour,
  );

  if (!currentRule || currentRule.endHour === 24) {
    nextTransition.setDate(nextTransition.getDate() + 1);
    nextTransition.setHours(0, 0, 0, 0);
  } else {
    nextTransition.setHours(currentRule.endHour, 0, 0, 0);
  }

  return nextTransition;
}

export function resolveTheme(mode: ThemeMode): ThemeName {
  return mode === "auto" ? getAutoTheme() : mode;
}

export function applyDashboardTheme(themeName: ThemeName) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(dashboardThemes[themeName].variables)) {
    root.style.setProperty(name, value);
  }
}
