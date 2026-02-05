import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { createNote, createTask } from "../data/api";
import { useUIStore } from "../stores/uiStore";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { useSettings } from "../hooks/useSettings";

interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  run: () => void | Promise<void>;
}

export const CommandPalette = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { settings, updateSettings } = useSettings();
  const projects = useLiveQuery(() => db.projects.toArray(), [], []) ?? [];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    if (!commandPaletteOpen) setQuery("");
  }, [commandPaletteOpen]);

  const actions = useMemo<CommandAction[]>(() => {
    const base: CommandAction[] = [
      {
        id: "toggle-theme",
        label: "Toggle theme",
        hint: "Light/Dark",
        run: () =>
          updateSettings({ theme: settings.theme === "light" ? "dark" : "light" }),
      },
      {
        id: "go-settings",
        label: "Open Settings",
        run: () => navigate("/settings"),
      },
    ];

    if (projectId) {
      base.unshift(
        {
          id: "new-task",
          label: "Create task",
          hint: "Quick task",
          run: async () => {
            await createTask({
              projectId,
              title: "New Task",
              description: "",
            });
          },
        },
        {
          id: "new-note",
          label: "Create note",
          hint: "Quick note",
          run: async () => {
            await createNote({
              projectId,
              title: "New Note",
              content: "",
            });
          },
        }
      );
    }

    projects.forEach((project) => {
      base.push({
        id: `project-${project.projectId}`,
        label: `Switch to ${project.name}`,
        hint: "Project",
        run: () => navigate(`/project/${project.projectId}/kanban`),
      });
    });

    return base;
  }, [navigate, projectId, projects, settings.theme, updateSettings]);

  const filtered = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const runAction = async (action: CommandAction) => {
    await action.run();
    setCommandPaletteOpen(false);
  };

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="max-w-xl">
        <div className="space-y-3">
          <Input
            autoFocus
            placeholder="Type a command..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="max-h-64 overflow-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="text-sm text-base-content/60">No commands</div>
            ) : (
              filtered.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => runAction(action)}
                  className="w-full surface-card px-3 py-2 text-left hover:bg-base-200/40 transition-colors"
                >
                  <div className="text-sm font-medium">{action.label}</div>
                  {action.hint && (
                    <div className="text-xs text-base-content/60">{action.hint}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
