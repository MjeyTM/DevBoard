import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { db } from "../../data/db";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { updateTask, updateNote, startTimeLog, stopTimeLog, convertChecklistItemToTask } from "../../data/api";
import { useSettings } from "../../hooks/useSettings";
import { formatDate, toCalendarInput, toIsoDate } from "../../lib/date";
import { extractNoteLinks } from "../../utils/notes";
import { createId } from "../../utils/uuid";
import type { Note, Task } from "../../types/models";
import { cn } from "../../lib/utils";

const statusVariant = (status: string) => {
  const lowered = status.toLowerCase();
  if (lowered.includes("done")) return "success";
  if (lowered.includes("blocked")) return "error";
  if (lowered.includes("progress")) return "info";
  if (lowered.includes("review")) return "warning";
  return "secondary";
};

const priorityVariant = (priority: string) => {
  if (priority === "P0") return "error";
  if (priority === "P1") return "warning";
  if (priority === "P2") return "info";
  return "secondary";
};

const PRIORITIES = ["P0", "P1", "P2", "P3"];
const TYPES = ["Feature", "Bug", "Fix", "Chore", "Refactor", "Research"];
const SEVERITIES = ["S1", "S2", "S3", "S4"];
const EFFORTS = ["XS", "S", "M", "L", "XL", "XXL"];

export const InspectorPanel = () => {
  const { selectedTaskId, selectedNoteId } = useUIStore();
  const { settings } = useSettings();

  const task = useLiveQuery<Task | undefined>(
    () => (selectedTaskId ? db.tasks.get(selectedTaskId) : undefined),
    [selectedTaskId]
  );

  const note = useLiveQuery<Note | undefined>(
    () => (selectedNoteId ? db.notes.get(selectedNoteId) : undefined),
    [selectedNoteId]
  );

  const projectId = task?.projectId ?? note?.projectId;
  const open = Boolean(task || note);

  const projectTasks =
    useLiveQuery<Task[]>(
      () => (projectId ? db.tasks.where("projectId").equals(projectId).toArray() : []),
      [projectId]
    ) ?? [];

  const projectNotes =
    useLiveQuery<Note[]>(
      () => (projectId ? db.notes.where("projectId").equals(projectId).toArray() : []),
      [projectId]
    ) ?? [];

  const backlinks = useMemo(() => {
    if (!note) return [];
    return (projectNotes ?? []).filter((n) =>
      extractNoteLinks(n.content).some((title) => title.toLowerCase() === note.title.toLowerCase())
    );
  }, [note, projectNotes]);

  const totalTime = useMemo(() => {
    if (!task) return 0;
    return task.timeLogs.reduce((sum, log) => sum + ((log.end ?? Date.now()) - log.start), 0);
  }, [task]);

  const [newChecklist, setNewChecklist] = useState("");
  const [newAttachment, setNewAttachment] = useState({ label: "", url: "" });

  const toggleTaskNoteLink = async (noteId: string) => {
    if (!task) return;
    const linked = task.linkedNoteIds.includes(noteId)
      ? task.linkedNoteIds.filter((id) => id !== noteId)
      : [...task.linkedNoteIds, noteId];
    await updateTask(task.taskId, { linkedNoteIds: linked });
  };

  const toggleNoteTaskLink = async (taskId: string) => {
    if (!note) return;
    const linked = note.linkedTaskIds.includes(taskId)
      ? note.linkedTaskIds.filter((id) => id !== taskId)
      : [...note.linkedTaskIds, taskId];
    await updateNote(note.noteId, { linkedTaskIds: linked });
  };

  return (
    <aside
      className={cn(
        "border-t border-base-200/60 md:border-t-0 md:border-l md:border-base-200/60 bg-base-100 p-4 h-full overflow-auto transition-all duration-200 ease-out",
        open ? "opacity-100 md:w-[340px] translate-x-0" : "opacity-0 md:w-0 translate-x-4 pointer-events-none"
      )}
    >
      {!task && !note ? (
        <div className="text-sm text-base-content/60">
          Select a task or note to see details.
        </div>
      ) : null}

      {task && (
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-base-content/60">Task</div>
            <Input
              value={task.title}
              onChange={(event) => updateTask(task.taskId, { title: event.target.value })}
              className="mt-2"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(task.status)}>Status · {task.status}</Badge>
              <Badge variant={priorityVariant(task.priority)}>Priority · {task.priority}</Badge>
              <Badge variant="outline">Due · {formatDate(task.dueDate, settings.calendar)}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Description</label>
            <Textarea
              rows={5}
              value={task.description}
              onChange={(event) => updateTask(task.taskId, { description: event.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-base-content/60">Status</label>
              <Select
                value={task.status}
                onChange={(event) => updateTask(task.taskId, { status: event.target.value })}
              >
                {settings.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-base-content/60">Type</label>
              <Select
                value={task.type}
                onChange={(event) => updateTask(task.taskId, { type: event.target.value as Task["type"] })}
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-base-content/60">Priority</label>
              <Select
                value={task.priority}
                onChange={(event) => updateTask(task.taskId, { priority: event.target.value as Task["priority"] })}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-base-content/60">Severity</label>
              <Select
                value={task.severity ?? ""}
                onChange={(event) => updateTask(task.taskId, { severity: event.target.value as Task["severity"] })}
              >
                <option value="">—</option>
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-base-content/60">Start Date ({settings.calendar})</label>
              <Input
                type={settings.calendar === "gregorian" ? "date" : "text"}
                value={toCalendarInput(task.startDate, settings.calendar)}
                onChange={(event) =>
                  updateTask(task.taskId, { startDate: toIsoDate(event.target.value, settings.calendar) })
                }
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="text-xs text-base-content/60">Due Date ({settings.calendar})</label>
              <Input
                type={settings.calendar === "gregorian" ? "date" : "text"}
                value={toCalendarInput(task.dueDate, settings.calendar)}
                onChange={(event) =>
                  updateTask(task.taskId, { dueDate: toIsoDate(event.target.value, settings.calendar) })
                }
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Tags (comma separated)</label>
            <Input
              value={task.tags.join(", ")}
              onChange={(event) =>
                updateTask(task.taskId, {
                  tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Blocked Reason</label>
            <Input
              value={task.blockedReason ?? ""}
              onChange={(event) => updateTask(task.taskId, { blockedReason: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-base-content/60">Checklist</label>
              <span className="text-xs text-base-content/60">
                {task.checklist.filter((item) => item.done).length}/{task.checklist.length}
              </span>
            </div>
            <div className="space-y-2">
              {task.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={(checked) =>
                      updateTask(task.taskId, {
                        checklist: task.checklist.map((entry) =>
                          entry.id === item.id ? { ...entry, done: Boolean(checked) } : entry
                        ),
                      })
                    }
                  />
                  <Input
                    value={item.text}
                    onChange={(event) =>
                      updateTask(task.taskId, {
                        checklist: task.checklist.map((entry) =>
                          entry.id === item.id ? { ...entry, text: event.target.value } : entry
                        ),
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => convertChecklistItemToTask(task.taskId, item)}
                  >
                    To Task
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newChecklist}
                onChange={(event) => setNewChecklist(event.target.value)}
                placeholder="New checklist item"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!newChecklist.trim()) return;
                  updateTask(task.taskId, {
                    checklist: [...task.checklist, { id: createId(), text: newChecklist.trim(), done: false }],
                  });
                  setNewChecklist("");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Attachments</label>
            {task.attachments.map((attachment) => (
              <div key={attachment.id} className="flex gap-2">
                <Input
                  value={attachment.label}
                  onChange={(event) =>
                    updateTask(task.taskId, {
                      attachments: task.attachments.map((entry) =>
                        entry.id === attachment.id ? { ...entry, label: event.target.value } : entry
                      ),
                    })
                  }
                />
                <Input
                  value={attachment.url}
                  onChange={(event) =>
                    updateTask(task.taskId, {
                      attachments: task.attachments.map((entry) =>
                        entry.id === attachment.id ? { ...entry, url: event.target.value } : entry
                      ),
                    })
                  }
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Label"
                value={newAttachment.label}
                onChange={(event) => setNewAttachment((prev) => ({ ...prev, label: event.target.value }))}
              />
              <Input
                placeholder="URL"
                value={newAttachment.url}
                onChange={(event) => setNewAttachment((prev) => ({ ...prev, url: event.target.value }))}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!newAttachment.label || !newAttachment.url) return;
                  updateTask(task.taskId, {
                    attachments: [
                      ...task.attachments,
                      { id: createId(), label: newAttachment.label, url: newAttachment.url },
                    ],
                  });
                  setNewAttachment({ label: "", url: "" });
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Time Tracking</label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {Math.round(totalTime / 60000)} min
              </Badge>
              <Button size="sm" variant="outline" onClick={() => startTimeLog(task.taskId)}>
                Start
              </Button>
              <Button size="sm" variant="outline" onClick={() => stopTimeLog(task.taskId)}>
                Stop
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Linked Notes</label>
            <div className="space-y-2">
              {(projectNotes ?? []).map((noteItem) => (
                <label key={noteItem.noteId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={task.linkedNoteIds.includes(noteItem.noteId)}
                    onCheckedChange={() => toggleTaskNoteLink(noteItem.noteId)}
                  />
                  {noteItem.title}
                </label>
              ))}
            </div>
          </div>

          <div className="text-xs text-base-content/60">
            Updated {new Date(task.updatedAt).toLocaleString()} • Due {formatDate(task.dueDate, settings.calendar)}
          </div>
        </div>
      )}

      {note && (
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-base-content/60">Note</div>
            <Input
              value={note.title}
              onChange={(event) => updateNote(note.noteId, { title: event.target.value })}
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Tags (comma separated)</label>
            <Input
              value={note.tags.join(", ")}
              onChange={(event) =>
                updateNote(note.noteId, {
                  tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Content (Markdown)</label>
            <Textarea
              rows={10}
              value={note.content}
              onChange={(event) => updateNote(note.noteId, { content: event.target.value })}
            />
          </div>

          <div>
            <div className="text-xs text-base-content/60 mb-2">Preview</div>
            <div className="markdown-body rounded-md border border-base-200 p-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {note.content}
              </ReactMarkdown>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-base-content/60">Linked Tasks</label>
            <div className="space-y-2">
              {(projectTasks ?? []).map((taskItem) => (
                <label key={taskItem.taskId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={note.linkedTaskIds.includes(taskItem.taskId)}
                    onCheckedChange={() => toggleNoteTaskLink(taskItem.taskId)}
                  />
                  {taskItem.title}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-base-content/60 mb-2">Backlinks</div>
            {backlinks.length === 0 ? (
              <div className="text-sm text-base-content/60">No backlinks yet.</div>
            ) : (
              <div className="space-y-2">
                {backlinks.map((link) => (
                  <div key={link.noteId} className="rounded-md border border-base-200 px-3 py-2">
                    {link.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
