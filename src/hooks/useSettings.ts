import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, defaultSettings } from "../data/db";
import type { Settings } from "../types/models";

export const useSettings = () => {
  const storedSettings = useLiveQuery(() => db.settings.get("settings"), [], undefined);
  const settings = storedSettings ?? defaultSettings;
  const hydrated = Boolean(storedSettings);

  useEffect(() => {
    const resolveTheme = () => {
      if (settings.theme === "system" && typeof window !== "undefined") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "night" : "light";
      }
      return settings.theme;
    };
    const themeToApply = resolveTheme();
    document.documentElement.setAttribute("data-theme", themeToApply);
    const root = document.documentElement;
    const sans =
      settings.fontFamily && settings.fontFamily !== "system"
        ? settings.fontFamily
        : "system-ui";
    const mono =
      settings.monoFont && settings.monoFont !== "system"
        ? settings.monoFont
        : "ui-monospace";
    root.style.setProperty("--font-sans", sans);
    root.style.setProperty("--font-mono", mono);
  }, [settings.theme, settings.fontFamily, settings.monoFont]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    localStorage.setItem("devboard-theme", settings.theme);
    localStorage.setItem("devboard-font", settings.fontFamily ?? "system");
    localStorage.setItem("devboard-mono-font", settings.monoFont ?? "system");
    localStorage.setItem("devboard-calendar", settings.calendar);
  }, [hydrated, settings.theme, settings.fontFamily, settings.monoFont, settings.calendar]);

  useEffect(() => {
    if (settings.theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = () => {
      const themeToApply = media.matches ? "night" : "light";
      document.documentElement.setAttribute("data-theme", themeToApply);
    };
    if (media.addEventListener) {
      media.addEventListener("change", handle);
    } else {
      media.addListener(handle);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handle);
      } else {
        media.removeListener(handle);
      }
    };
  }, [settings.theme]);

  const updateSettings = async (updates: Partial<Settings>) => {
    await db.settings.put({ ...settings, ...updates, id: "settings" });
  };

  return { settings, updateSettings };
};
