import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "react-router-dom";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { toJalaali } from "jalaali-js";
import { db } from "../data/db";
import { useSettings } from "../hooks/useSettings";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import type { Task } from "../types/models";
import { ProjectHeader } from "../components/layout/ProjectHeader";

export const ProjectCalendarPage = () => {
  const { projectId } = useParams();
  const { settings } = useSettings();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const tasks =
    useLiveQuery<Task[]>(
      () => (projectId ? db.tasks.where("projectId").equals(projectId).toArray() : []),
      [projectId]
    ) ?? [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const days = useMemo(() => {
    const items: { date: Date; iso: string }[] = [];
    for (let i = 1; i <= daysInMonth; i += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const iso = format(date, "yyyy-MM-dd");
      items.push({ date, iso });
    }
    return items;
  }, [currentMonth, daysInMonth]);

  const monthLabel = useMemo(() => {
    if (settings.calendar === "jalali") {
      const j = toJalaali(monthStart.getFullYear(), monthStart.getMonth() + 1, monthStart.getDate());
      return `${j.jy}/${String(j.jm).padStart(2, "0")}`;
    }
    return format(monthStart, "MMMM yyyy");
  }, [monthStart, settings.calendar]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((task) => {
      const date = task.dueDate ?? task.startDate;
      if (!date) return;
      map[date] = map[date] ? [...map[date], task] : [task];
    });
    return map;
  }, [tasks]);

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            Prev
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-xs text-base-content/60 text-center">
            {day}
          </div>
        ))}
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {days.map(({ date, iso }) => {
          const dayLabel = settings.calendar === "jalali"
            ? String(toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate()).jd)
            : String(date.getDate());
          const dayTasks = tasksByDate[iso] ?? [];
          return (
            <div
              key={iso}
              className="min-h-[110px] rounded-md border border-base-200 p-2 text-xs flex flex-col gap-2"
            >
              <div className="font-medium">{dayLabel}</div>
              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div key={task.taskId}>
                    <Badge variant="secondary" className="truncate">
                      {task.title}
                    </Badge>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-base-content/60">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
