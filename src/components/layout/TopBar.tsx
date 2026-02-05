import { useLocation, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../data/db";
import { useSettings } from "../../hooks/useSettings";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import type { Project } from "../../types/models";
import { ChevronLeft, ChevronRight, MoreHorizontal, Share2 } from "lucide-react";
import { TabBar } from "./TabBar";

const THEMES = [
  "system",
  "light",
  "dark",
  "cupcake",
  "emerald",
  "corporate",
  "retro",
  "valentine",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "lemonade",
  "night",
  "coffee",
  "winter",
];

export const TopBar = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const project = useLiveQuery<Project | undefined>(
    () => (projectId ? db.projects.get(projectId) : undefined),
    [projectId]
  );
  const { settings, updateSettings } = useSettings();

  const isProject = location.pathname.includes("/project/");

  const viewLabel = location.pathname.includes("/kanban")
    ? "By Status"
    : location.pathname.includes("/calendar")
      ? "Calendar"
      : location.pathname.includes("/notes")
        ? "Notes"
        : location.pathname.includes("/list")
          ? "All Tasks"
          : "Overview";

  return (
    <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur border-b border-base-200/60">
      <TabBar />
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <Button size="icon" variant="ghost">
            <ChevronLeft size={16} />
          </Button>
          <Button size="icon" variant="ghost">
            <ChevronRight size={16} />
          </Button>
          <div className="h-5 w-px bg-base-200/70" />
          <div className="flex items-center gap-2">
            <span className="text-base-content/50">{isProject ? "Tasks Tracker" : "Workspace"}</span>
            <span className="text-base-content/40">/</span>
            <span className="text-base-content">{project?.name ?? "Dashboard"}</span>
            <span className="text-base-content/40">/</span>
            <span className="text-base-content/70">{viewLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={settings.theme}
            onChange={(event) => updateSettings({ theme: event.target.value })}
            className="w-36"
          >
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateSettings({ calendar: settings.calendar === "gregorian" ? "jalali" : "gregorian" })}
          >
            {settings.calendar === "gregorian" ? "Jalali" : "Gregorian"}
          </Button>
          <Button size="sm" variant="outline">
            <Share2 size={14} className="mr-1" /> Share
          </Button>
          <Button size="icon" variant="ghost">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
