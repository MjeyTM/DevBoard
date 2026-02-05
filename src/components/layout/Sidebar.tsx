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
        "sidebar-shell h-full md:h-screen md:sticky md:top-0 border-b border-base-200/70 md:border-b-0 px-2.5 py-3 transition-all duration-200 ease-out",
        collapsed ? "md:w-14" : "md:w-56"
      )}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-3">
          <Link to="/" className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
            DB
          </Link>
          <button
            className="sidebar-icon-item"
            onClick={() => setCommandPaletteOpen(true)}
            title="Search"
          >
            <Search size={16} />
          </button>
          <NavLink to="/" className={({ isActive }) => cn("sidebar-icon-item", isActive && "sidebar-icon-item-active")}>
            <Home size={16} />
          </NavLink>
          <button className="sidebar-icon-item" title="Inbox">
            <Inbox size={16} />
          </button>
          <div className="sidebar-icon-divider" />
          <div className="text-[9px] tracking-[0.25em] text-base-content/40">PRIVATE</div>
          {projects.slice(0, 6).map((project) => (
            <NavLink
              key={project.projectId}
              to={`/project/${project.projectId}/list`}
              className={({ isActive }) => cn("sidebar-icon-item", isActive && "sidebar-icon-item-active")}
              title={project.name}
            >
              <Star size={14} />
            </NavLink>
          ))}
          <ProjectFormDialog compact />
          <div className="sidebar-icon-divider" />
          <button className="sidebar-icon-item" title="Views">
            <Star size={14} />
          </button>
          <NavLink to="/settings" className={({ isActive }) => cn("sidebar-icon-item", isActive && "sidebar-icon-item-active")} title="Settings">
            <Settings size={16} />
          </NavLink>
          <button className="sidebar-icon-item" title="Add new">
            <Plus size={16} />
          </button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} title="Expand sidebar">
            <ChevronRight size={16} />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                DB
              </div>
              <div>
                <div className="sidebar-title">DevBoard</div>
                <div className="text-xs text-base-content/50">Private</div>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCommandPaletteOpen(true)} title="Command palette">
                ⌘K
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} title="Collapse sidebar">
                <ChevronLeft size={16} />
              </Button>
            </div>
          </div>

          <div className="mb-3">
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
                <button className="sidebar-item sidebar-item-hover" onClick={() => setCommandPaletteOpen(true)}>
                  <Search size={16} className="text-base-content/50" />
                  Search
                </button>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    cn("sidebar-item sidebar-item-hover", isActive && "sidebar-item-active")
                  }
                >
                  <Home size={16} className="text-base-content/50" />
                  Home
                </NavLink>
                <button className="sidebar-item sidebar-item-hover">
                  <Inbox size={16} className="text-base-content/50" />
                  Inbox
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
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
                        cn("sidebar-item sidebar-item-hover", isActive && "sidebar-item-active")
                      }
                    >
                      <Star size={14} className="text-base-content/50" />
                      <span className="truncate">{project.name}</span>
                      <Badge variant="secondary" className="ml-auto text-[9px] uppercase">
                        {project.status}
                      </Badge>
                    </NavLink>
                  ))}
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-base-content/60">
                    <ProjectFormDialog />
                    New project
                  </div>
                </div>
              </div>

              <div>
                <div className="sidebar-section-title mb-2">Views</div>
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
                          className="sidebar-item sidebar-item-hover text-left"
                          onClick={() => navigate(targetUrl)}
                        >
                          <Star size={14} className="text-base-content/50" />
                          {view.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-1">
            <NavLink to="/settings" className="sidebar-item sidebar-item-hover">
              <Settings size={16} className="text-base-content/50" />
              Settings
            </NavLink>
            <button className="sidebar-item sidebar-item-hover">
              <Plus size={16} className="text-base-content/50" />
              Add new
            </button>
          </div>
        </>
      )}
    </aside>
  );
};
