import { useEffect, useMemo, useState } from "react";
import { List, type RowComponentProps } from "react-window";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../data/db";
import { useSettings } from "../hooks/useSettings";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { formatDate } from "../lib/date";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { createId } from "../utils/uuid";
import type { Task } from "../types/models";
import { ProjectHeader } from "../components/layout/ProjectHeader";

export const ProjectListPage = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { settings, updateSettings } = useSettings();
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [viewName, setViewName] = useState("");

  useEffect(() => {
    const status = searchParams.get("status");
    const text = searchParams.get("text");
    if (status) setStatusFilter(status);
    if (text) setQuery(text);
  }, [searchParams]);

  const tasks =
    useLiveQuery<Task[]>(
      () => (projectId ? db.tasks.where("projectId").equals(projectId).toArray() : []),
      [projectId]
    ) ?? [];

  const Row = ({ index, style, items }: RowComponentProps<{
    items: Task[];
  }>) => {
    const task = items[index];
    if (!task) return null;
    return (
      <div
        style={style}
        className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-base-200/60 text-sm hover:bg-base-200/40 transition-colors"
      >
        <div>
          <div className="font-medium">{task.title}</div>
          <div className="text-xs text-base-content/60">{task.type}</div>
        </div>
        <div>{task.status}</div>
        <div>{task.priority}</div>
        <div>{formatDate(task.dueDate, settings.calendar)}</div>
      </div>
    );
  };

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesQuery = task.title.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [tasks, statusFilter, query]);

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search tasks"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-64"
        />
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          {settings.statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Badge variant="secondary">{filtered.length} tasks</Badge>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Save View</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Filter</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="View name"
                value={viewName}
                onChange={(event) => setViewName(event.target.value)}
              />
              <Button
                onClick={() => {
                  if (!viewName.trim()) return;
                  const view = {
                    viewId: createId(),
                    name: viewName.trim(),
                    projectId,
                    filter: {
                      status: statusFilter === "all" ? undefined : [statusFilter],
                      text: query.trim() ? query.trim() : undefined,
                    },
                  };
                  updateSettings({ savedViews: [...settings.savedViews, view] });
                  setViewName("");
                }}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-3 text-xs uppercase tracking-wide text-base-content/60 bg-base-200/60">
          <div>Title</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Due</div>
        </div>
        <List
          rowCount={filtered.length}
          rowHeight={56}
          rowComponent={Row}
          rowProps={{ items: filtered }}
          style={{ height: 480 }}
        />
      </div>
    </div>
  );
};
