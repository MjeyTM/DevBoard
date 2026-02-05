import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { isWithinNextDays } from "../lib/date";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const DashboardPage = () => {
  const projects = useLiveQuery(() => db.projects.toArray(), [], []) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []) ?? [];
  const notes = useLiveQuery(() => db.notes.orderBy("updatedAt").reverse().limit(5).toArray(), [], []) ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter((task) => task.dueDate === today);
  const upcoming = tasks.filter((task) => isWithinNextDays(task.dueDate, 7));
  const doneThisWeek = tasks.filter(
    (task) => task.status.toLowerCase() === "done" && Date.now() - task.updatedAt < 7 * 86400000
  );
  const openBugs = tasks.filter((task) => task.type === "Bug" && task.status !== "Done");
  const inProgress = tasks.filter((task) => task.status.toLowerCase().includes("progress"));

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    tasks.forEach((task) => {
      groups[task.status] = (groups[task.status] ?? 0) + 1;
    });
    return Object.entries(groups).map(([status, count]) => ({ status, count }));
  }, [tasks]);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((project) => map.set(project.projectId, project.name));
    return map;
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">A calm overview of your active projects and work.</div>
      </div>
      <div className="grid gap-4 lg:grid-cols-12 auto-rows-[minmax(140px,auto)]">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {projects.filter((project) => project.status === "active").length}
          </div>
          <div className="text-sm text-base-content/60">
            Total projects: {projects.length}
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{todayTasks.length}</div>
          <div className="text-sm text-base-content/60">Tasks due today</div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Open Bugs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{openBugs.length}</div>
          <div className="text-sm text-base-content/60">Needs attention</div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{inProgress.length}</div>
          <div className="text-sm text-base-content/60">Active tasks</div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-7 lg:row-span-2">
        <CardHeader>
          <CardTitle>Upcoming (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="text-sm text-base-content/60">No upcoming tasks</div>
            ) : (
              upcoming.slice(0, 6).map((task) => (
                <div key={task.taskId} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="text-xs text-base-content/60">
                      {projectMap.get(task.projectId) ?? task.projectId}
                    </div>
                  </div>
                  <Badge variant="secondary">{task.dueDate}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-5 lg:row-span-2">
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          {chartData.length === 0 ? (
            <div className="text-sm text-base-content/60">No tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-6">
        <CardHeader>
          <CardTitle>Recently Updated Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-sm text-base-content/60">No notes yet</div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.noteId} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{note.title}</div>
                    <div className="text-xs text-base-content/60">
                      Updated {new Date(note.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="secondary">{note.tags.join(" ") || "note"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-6">
        <CardHeader>
          <CardTitle>Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{doneThisWeek.length}</div>
          <div className="text-sm text-base-content/60">Tasks completed in last 7 days</div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
