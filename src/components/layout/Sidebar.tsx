import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../data/db";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useSearch } from "../../hooks/useSearch";
import { useUIStore } from "../../stores/uiStore";
import { ProjectFormDialog } from "../project/ProjectFormDialog";
import { useSettings } from "../../hooks/useSettings";
import { cn } from "../../lib/utils";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Inbox,
  Plus,
  Search,
  Settings,
  Star,
} from "lucide-react";

export const Sidebar = () => {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const projects = useLiveQuery(() => db.projects.orderBy("updatedAt").reverse().toArray(), [], []) ?? [];
  const { results } = useSearch(query);
  const { settings } = useSettings();
  const { setCommandPaletteOpen } = useUIStore();
  const navigate = useNavigate();

  const savedViews = useMemo(() => settings.savedViews ?? [], [settings.savedViews]);

  const handleResultClick = (result: (typeof results)[number]) => {
    if (result.source === "project") {
      navigate(`/project/${result.id}/kanban`);
    }
    if (result.source === "task") {
      const task = db.tasks.get(result.id);
      task.then((t) => t && navigate(`/project/${t.projectId}/list`));
    }
    if (result.source === "note") {
      const note = db.notes.get(result.id);
      note.then((n) => n && navigate(`/project/${n.projectId}/notes`));
    }
    setQuery("");
  };

  return (
    <aside
      className={cn(
        "sidebar-shell h-full md:h-screen md:sticky md:top-0 border-b border-base-200/70 md:border-b-0 px-3 py-4 transition-all duration-200 ease-out",
        collapsed ? "md:w-20" : "md:w-64"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/"
          className={cn("flex items-center gap-2 transition-opacity", collapsed && "opacity-0 pointer-events-none")}
        >
          <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
            DB
          </div>
          <div>
            <div className="sidebar-title">DevBoard Space</div>
            <div className="text-xs text-base-content/50">Private</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCommandPaletteOpen(true)} title="Command palette">
            ⌘K
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((prev) => !prev)} title="Collapse sidebar">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </div>

      <div className={cn("mb-3 transition-opacity", collapsed && "opacity-0 pointer-events-none")}>
        <Input
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {query ? (
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="text-sm text-base-content/60">No results</div>
          ) : (
            results.slice(0, 8).map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleResultClick(result)}
                className="w-full surface-card px-3 py-2 text-left hover:bg-base-200/40 transition-colors"
              >
                <div className="text-sm font-medium">{result.title}</div>
                <div className="text-xs text-base-content/60 capitalize">{result.source}</div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="space-y-1">
            <button
              className={cn("sidebar-item sidebar-item-hover", collapsed && "justify-center")}
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search size={16} className="text-base-content/50" />
              <span className={cn(collapsed && "sr-only")}>Search</span>
            </button>
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn("sidebar-item sidebar-item-hover", isActive && "sidebar-item-active", collapsed && "justify-center")
              }
            >
              <Home size={16} className="text-base-content/50" />
              <span className={cn(collapsed && "sr-only")}>Home</span>
            </NavLink>
            <button className={cn("sidebar-item sidebar-item-hover", collapsed && "justify-center")}>
              <Inbox size={16} className="text-base-content/50" />
              <span className={cn(collapsed && "sr-only")}>Inbox</span>
            </button>
          </div>

          <div>
            <div className={cn("flex items-center justify-between mb-2", collapsed && "justify-center")}>
              <div className="sidebar-section-title">Private</div>
              <div className="flex items-center gap-1 text-base-content/40">
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <NavLink
                  key={project.projectId}
                  to={`/project/${project.projectId}/list`}
                  className={({ isActive }) =>
                    cn("sidebar-item sidebar-item-hover", isActive && "sidebar-item-active", collapsed && "justify-center")
                  }
                >
                  <Star size={14} className="text-base-content/50" />
                  <span className={cn("truncate", collapsed && "sr-only")}>{project.name}</span>
                  {!collapsed && (
                    <Badge variant="secondary" className="ml-auto text-[9px] uppercase">
                      {project.status}
                    </Badge>
                  )}
                </NavLink>
              ))}
              <div className={cn("flex items-center gap-2 px-3 py-2 text-xs text-base-content/60", collapsed && "justify-center")}>
                <ProjectFormDialog />
                <span className={cn(collapsed && "sr-only")}>New project</span>
              </div>
            </div>
          </div>

          <div>
            <div className={cn("sidebar-section-title mb-2", collapsed && "text-center")}>Views</div>
            {savedViews.length === 0 ? (
              <div className="text-xs text-base-content/60">No saved views yet</div>
            ) : (
              <div className="flex flex-col gap-1">
                {savedViews.map((view) => {
                  const status = view.filter.status?.[0];
                  const text = view.filter.text;
                  const params = new URLSearchParams();
                  if (status) params.set("status", status);
                  if (text) params.set("text", text);
                  const targetProject = view.projectId ?? projects[0]?.projectId;
                  const targetUrl = targetProject
                    ? `/project/${targetProject}/list?${params.toString()}`
                    : "/";
                  return (
                    <button
                      key={view.viewId}
                      className={cn("sidebar-item sidebar-item-hover text-left", collapsed && "justify-center")}
                      onClick={() => navigate(targetUrl)}
                    >
                      <Star size={14} className="text-base-content/50" />
                      <span className={cn(collapsed && "sr-only")}>{view.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <NavLink
          to="/settings"
          className={cn("sidebar-item sidebar-item-hover", collapsed && "justify-center")}
        >
          <Settings size={16} className="text-base-content/50" />
          <span className={cn(collapsed && "sr-only")}>Settings</span>
        </NavLink>
        <button className={cn("sidebar-item sidebar-item-hover", collapsed && "justify-center")}>
          <Plus size={16} className="text-base-content/50" />
          <span className={cn(collapsed && "sr-only")}>Add new</span>
        </button>
      </div>
    </aside>
  );
};
