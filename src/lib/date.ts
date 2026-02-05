import { format } from "date-fns";
import { toJalaali, toGregorian } from "jalaali-js";

export type CalendarMode = "gregorian" | "jalali";

export const todayIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDate = (iso: string | undefined, calendar: CalendarMode) => {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  if (calendar === "jalali") {
    const j = toJalaali(year, month, day);
    return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
  }
  return format(new Date(year, month - 1, day), "yyyy-MM-dd");
};

export const toIsoDate = (value: string, calendar: CalendarMode) => {
  if (!value) return undefined;
  if (calendar === "jalali") {
    const [jy, jm, jd] = value.split(/[-/]/).map(Number);
    if (!jy || !jm || !jd) return undefined;
    const g = toGregorian(jy, jm, jd);
    return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const toCalendarInput = (iso: string | undefined, calendar: CalendarMode) => {
  if (!iso) return "";
  if (calendar === "jalali") {
    const [year, month, day] = iso.split("-").map(Number);
    const j = toJalaali(year, month, day);
    return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
  }
  return iso;
};

export const isWithinNextDays = (iso: string | undefined, days: number) => {
  if (!iso) return false;
  const [year, month, day] = iso.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);
  return due >= new Date(now.toDateString()) && due <= future;
};
