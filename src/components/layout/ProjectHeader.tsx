import { NavLink, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../data/db";
import { QuickAddDialog } from "../QuickAddDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CalendarDays, KanbanSquare, ListChecks, NotebookText, SlidersHorizontal } from "lucide-react";
import type { Project } from "../../types/models";
import { cn } from "../../lib/utils";

const views = [
  { label: "All Tasks", path: "list", icon: ListChecks },
  { label: "By Status", path: "kanban", icon: KanbanSquare },
  { label: "Calendar", path: "calendar", icon: CalendarDays },
  { label: "Notes", path: "notes", icon: NotebookText },
];

export const ProjectHeader = () => {
  const { projectId } = useParams();
  const project = useLiveQuery<Project | undefined>(
    () => (projectId ? db.projects.get(projectId) : undefined),
    [projectId]
  );

  return (
    <div className="page-header">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
          ✓
        </div>
        <div>
          <div className="page-title">{project?.name ?? "Project"}</div>
          <div className="page-subtitle">{project?.description || "Track tasks, specs, and progress."}</div>
        </div>
        <Badge variant="secondary" className="ml-auto">Private</Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <NavLink
                key={view.path}
                to={projectId ? `/project/${projectId}/${view.path}` : "#"}
                className={({ isActive }) =>
                  cn("tab-pill flex items-center gap-2", isActive && "tab-pill-active")
                }
              >
                <Icon size={14} />
                {view.label}
              </NavLink>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <SlidersHorizontal size={14} className="mr-1" /> View
          </Button>
          <QuickAddDialog />
        </div>
      </div>
    </div>
  );
};
