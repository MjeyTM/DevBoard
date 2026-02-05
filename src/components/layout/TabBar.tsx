import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X } from "lucide-react";
import { db } from "../../data/db";
import { useTabsStore } from "../../stores/tabsStore";
import type { Project } from "../../types/models";
import { cn } from "../../lib/utils";

export const TabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const project = useLiveQuery<Project | undefined>(
    () => (projectId ? db.projects.get(projectId) : undefined),
    [projectId]
  );
  const { tabs, activeId, replaceActive, createTab, closeTab, setActive } = useTabsStore();

  const viewLabel = useMemo(() => {
    if (location.pathname.includes("/kanban")) return "By Status";
    if (location.pathname.includes("/calendar")) return "Calendar";
    if (location.pathname.includes("/notes")) return "Notes";
    if (location.pathname.includes("/list")) return "All Tasks";
    return "Overview";
  }, [location.pathname]);

  const title = useMemo(() => {
    if (location.pathname.startsWith("/settings")) return "Settings";
    if (projectId) return `${project?.name ?? "Project"} · ${viewLabel}`;
    return "Home";
  }, [location.pathname, project?.name, projectId, viewLabel]);

  const path = `${location.pathname}${location.search}`;

  useEffect(() => {
    replaceActive({ title, path });
  }, [path, title, replaceActive]);

  if (tabs.length === 0) return null;

  return (
    <div className="tabbar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            className={cn("tabbar-item", isActive && "tabbar-item-active")}
            onClick={() => {
              if (!isActive) {
                setActive(tab.id);
                navigate(tab.path);
              }
            }}
          >
            <span className="truncate">{tab.title}</span>
            <span
              role="button"
              tabIndex={0}
              className={cn("tabbar-close", tabs.length === 1 && "opacity-30 pointer-events-none")}
              onClick={(event) => {
                event.stopPropagation();
                if (tabs.length === 1) return;
                const index = tabs.findIndex((item) => item.id === tab.id);
                const fallback = tabs[index - 1] ?? tabs[index + 1];
                closeTab(tab.id);
                if (fallback) {
                  setActive(fallback.id);
                  navigate(fallback.path);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (tabs.length === 1) return;
                  const index = tabs.findIndex((item) => item.id === tab.id);
                  const fallback = tabs[index - 1] ?? tabs[index + 1];
                  closeTab(tab.id);
                  if (fallback) {
                    setActive(fallback.id);
                    navigate(fallback.path);
                  }
                }
              }}
            >
              <X size={12} />
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="tabbar-add"
        onClick={() => {
          const id = createTab({ title: "Home", path: "/" });
          setActive(id);
          navigate("/");
        }}
        aria-label="New tab"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
