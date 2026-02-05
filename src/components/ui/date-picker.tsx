import { useEffect, useMemo, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { CalendarMode, toCalendarInput } from "../../lib/date";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const GREGORIAN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const JALALI_MONTHS = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];

const WEEKDAYS_GREGORIAN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_JALALI = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const isoFromDate = (date: Date) => format(date, "yyyy-MM-dd");

const parseIso = (iso?: string) => {
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const getWeekIndex = (day: number, weekStartsOn: number) => (day - weekStartsOn + 7) % 7;

const toIsoFromJalali = (jy: number, jm: number, jd: number) => {
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
};

export type DatePickerProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
  calendar: CalendarMode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export const DatePicker = ({
  value,
  onChange,
  calendar,
  placeholder = "Select date",
  className,
  disabled,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const parsed = parseIso(value);
  const initialDate = parsed ?? new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const initialJalali = useMemo(() => {
    const base = parsed ?? new Date();
    const j = toJalaali(base.getFullYear(), base.getMonth() + 1, base.getDate());
    return { jy: j.jy, jm: j.jm };
  }, [parsed]);
  const [viewJalali, setViewJalali] = useState(initialJalali);

  useEffect(() => {
    const nextDate = parseIso(value);
    if (!nextDate) return;
    setViewDate(nextDate);
    const j = toJalaali(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
    setViewJalali({ jy: j.jy, jm: j.jm });
  }, [value]);

  const todayIso = isoFromDate(new Date());
  const displayValue = value ? toCalendarInput(value, calendar).replace(/-/g, "/") : "";

  const gregorianCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = getWeekIndex(first.getDay(), 1);
    const cells: Array<Date | null> = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  }, [viewDate]);

  const jalaliCells = useMemo(() => {
    const monthLength = jalaaliMonthLength(viewJalali.jy, viewJalali.jm);
    const firstG = toGregorian(viewJalali.jy, viewJalali.jm, 1);
    const firstDate = new Date(firstG.gy, firstG.gm - 1, firstG.gd);
    const leading = getWeekIndex(firstDate.getDay(), 6);
    const cells: Array<{ jy: number; jm: number; jd: number } | null> = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let day = 1; day <= monthLength; day += 1) {
      cells.push({ jy: viewJalali.jy, jm: viewJalali.jm, jd: day });
    }
    return cells;
  }, [viewJalali]);

  const handlePrev = () => {
    if (calendar === "gregorian") {
      setViewDate((prev) => subMonths(prev, 1));
      return;
    }
    setViewJalali((prev) => {
      const nextMonth = prev.jm - 1;
      if (nextMonth < 1) return { jy: prev.jy - 1, jm: 12 };
      return { ...prev, jm: nextMonth };
    });
  };

  const handleNext = () => {
    if (calendar === "gregorian") {
      setViewDate((prev) => addMonths(prev, 1));
      return;
    }
    setViewJalali((prev) => {
      const nextMonth = prev.jm + 1;
      if (nextMonth > 12) return { jy: prev.jy + 1, jm: 1 };
      return { ...prev, jm: nextMonth };
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg bg-base-200/40 px-3 text-sm text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ring-offset-base-100",
            disabled && "opacity-60 cursor-not-allowed",
            className
          )}
        >
          <span className={cn(!displayValue && "text-base-content/50")}>
            {displayValue || placeholder}
          </span>
          <Calendar size={14} className="text-base-content/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            className="h-7 w-7 rounded-full hover:bg-base-200/60 flex items-center justify-center"
            onClick={handlePrev}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-medium">
            {calendar === "gregorian"
              ? `${GREGORIAN_MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
              : `${JALALI_MONTHS[viewJalali.jm - 1]} ${viewJalali.jy}`}
          </div>
          <button
            type="button"
            className="h-7 w-7 rounded-full hover:bg-base-200/60 flex items-center justify-center"
            onClick={handleNext}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[11px] text-base-content/50 mb-1">
          {(calendar === "gregorian" ? WEEKDAYS_GREGORIAN : WEEKDAYS_JALALI).map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendar === "gregorian"
            ? gregorianCells.map((date, index) => {
                if (!date) return <div key={`g-empty-${index}`} />;
                const iso = isoFromDate(date);
                const isSelected = iso === value;
                const isToday = iso === todayIso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "h-8 rounded-md text-xs hover:bg-base-200/70 transition",
                      isSelected && "bg-primary text-primary-content",
                      !isSelected && isToday && "border border-primary/40"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })
            : jalaliCells.map((entry, index) => {
                if (!entry) return <div key={`j-empty-${index}`} />;
                const iso = toIsoFromJalali(entry.jy, entry.jm, entry.jd);
                const isSelected = iso === value;
                const isToday = iso === todayIso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "h-8 rounded-md text-xs hover:bg-base-200/70 transition",
                      isSelected && "bg-primary text-primary-content",
                      !isSelected && isToday && "border border-primary/40"
                    )}
                  >
                    {entry.jd}
                  </button>
                );
              })}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-base-content/60">
          <button
            type="button"
            className="hover:text-base-content"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="hover:text-base-content"
            onClick={() => {
              onChange(todayIso);
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
