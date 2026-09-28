"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyDashboardTheme, DASHBOARD_THEME_STORAGE_KEY, getAutoTheme, getNextAutoThemeTransition, isThemeMode, type ThemeMode } from "@/lib/dashboard-theme";

type ThemeContextValue = { themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "auto";
    const savedMode = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
    return isThemeMode(savedMode) ? savedMode : "auto";
  });
  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, themeMode);

    if (themeMode !== "auto") {
      applyDashboardTheme(themeMode);
      return;
    }

    let timeoutId: number | undefined;

    const applyAutoThemeAndScheduleNext = () => {
      applyDashboardTheme(getAutoTheme());

      const delay = Math.max(
        1_000,
        getNextAutoThemeTransition().getTime() - Date.now() + 50,
      );

      timeoutId = window.setTimeout(applyAutoThemeAndScheduleNext, delay);
    };

    applyAutoThemeAndScheduleNext();

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [themeMode]);

  const value = useMemo(() => ({ themeMode, setThemeMode }), [themeMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useDashboardTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useDashboardTheme must be used within ThemeProvider");
  return context;
}
