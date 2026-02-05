import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../data/db";
import { createTask, deleteTask, duplicateTask, updateTask } from "../data/api";
import { useSettings } from "../hooks/useSettings";
import { useUIStore } from "../stores/uiStore";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import type { Task } from "../types/models";
import { ProjectHeader } from "../components/layout/ProjectHeader";
import {
  Bug,
  Copy,
  Edit3,
  Eye,
  FlaskConical,
  GripVertical,
  Hammer,
  Lightbulb,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { DatePicker } from "../components/ui/date-picker";
import { MultiSelect } from "../components/ui/multi-select";
import { createId } from "../utils/uuid";

const typeIconMap: Record<Task["type"], React.ElementType> = {
  Feature: Lightbulb,
  Bug: Bug,
  Fix: Hammer,
  Chore: RefreshCcw,
  Refactor: RefreshCcw,
  Research: FlaskConical,
};

const priorityVariantMap: Record<Task["priority"], "error" | "warning" | "info" | "secondary"> = {
  P0: "error",
  P1: "warning",
  P2: "info",
  P3: "secondary",
};

const typeVariantMap: Record<Task["type"], "accent" | "error" | "warning" | "info" | "secondary"> = {
  Feature: "accent",
  Bug: "error",
  Fix: "warning",
  Chore: "secondary",
  Refactor: "info",
  Research: "accent",
};

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseChecklist = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let done = false;
      let text = line;
      if (text.startsWith("[x]") || text.startsWith("[X]")) {
        done = true;
        text = text.slice(3).trim();
      } else if (text.startsWith("[ ]")) {
        text = text.slice(3).trim();
      }
      return { id: createId(), text, done };
    });

const checklistToText = (checklist: Task["checklist"]) =>
  checklist.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`).join("\n");

const parseAttachments = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((part) => part.trim());
      if (!label || !url) return null;
      return { id: createId(), label, url };
    })
    .filter((item): item is { id: string; label: string; url: string } => Boolean(item));

const attachmentsToText = (attachments: Task["attachments"]) =>
  attachments.map((item) => `${item.label} | ${item.url}`).join("\n");

const parseTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber)) return asNumber;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseTimeLogs = (value: string): Task["timeLogs"] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [startRaw, endRaw, noteRaw] = line.split(",").map((part) => part.trim());
      const start = parseTime(startRaw);
      if (!start) return null;
      const end = parseTime(endRaw || "");
      const note = noteRaw || undefined;
      return { id: createId(), start, end, note };
    })
    .filter(Boolean) as Task["timeLogs"];

const timeLogsToText = (logs: Task["timeLogs"]) =>
  logs.map((log) => `${log.start},${log.end ?? ""},${log.note ?? ""}`).join("\n");

const parseEffort = (value: string): Task["effort"] | number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const asNumber = Number(trimmed);
  return Number.isFinite(asNumber) ? asNumber : (trimmed as Task["effort"]);
};

const DraggableTask = ({
  id,
  title,
  priority,
  type,
  tags,
  onDelete,
  onDuplicate,
  onContextMenu,
  onEdit,
}: {
  id: string;
  title: string;
  priority: Task["priority"];
  type: Task["type"];
  tags: string[];
  onDelete: () => void;
  onDuplicate: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onEdit: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: false,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  const Icon = typeIconMap[type] ?? Lightbulb;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onEdit}
      onContextMenu={onContextMenu}
      className="group rounded-xl bg-base-100 px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onEdit();
        if (event.key.toLowerCase() === "e") onEdit();
        if (event.key === "Delete" || event.key === "Backspace") onDelete();
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-7 w-7 rounded-lg bg-base-200/60 text-base-content/70 flex items-center justify-center cursor-grab"
            aria-label="Drag task"
            onClick={(event) => event.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <GripVertical size={14} />
          </button>
          <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">
            <Icon size={14} />
          </div>
          <div className="flex-1">
            <div className="font-medium leading-5">{title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant={typeVariantMap[type]} className="text-[10px]">{type}</Badge>
              <Badge variant={priorityVariantMap[priority]} className="text-[10px]">Priority {priority}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="h-7 w-7 rounded-full hover:bg-base-200/60 inline-flex items-center justify-center"
            aria-label="Edit task"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            className="h-7 w-7 rounded-full hover:bg-base-200/60 inline-flex items-center justify-center"
            aria-label="More actions"
            onClick={onContextMenu}
          >
            <MoreHorizontal size={14} />
          </button>
          <button
            type="button"
            className="h-7 w-7 rounded-full hover:bg-base-200/60 inline-flex items-center justify-center"
            aria-label="Delete task"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[9px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const KanbanColumn = ({
  status,
  tasks,
  onAdd,
  onDelete,
  onDuplicate,
  onStartInline,
  onEdit,
  onContextMenu,
}: {
  status: string;
  tasks: { taskId: string; title: string; priority: Task["priority"]; type: Task["type"]; tags: string[] }[];
  onAdd: () => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onStartInline: () => void;
  onEdit: (taskId: string) => void;
  onContextMenu: (event: React.MouseEvent, taskId: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-2xl bg-base-100/80 p-3 min-h-[220px] shadow-sm transition-colors ${
        isOver ? "bg-base-200/60" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{status}</div>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onAdd}>
          Add Task
        </Button>
        <Button size="sm" variant="ghost" onClick={onStartInline}>
          <Plus size={14} className="mr-1" /> New
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <DraggableTask
            key={task.taskId}
            id={task.taskId}
            title={task.title}
            priority={task.priority}
            type={task.type}
            tags={task.tags}
            onDelete={() => onDelete(task.taskId)}
            onDuplicate={() => onDuplicate(task.taskId)}
            onContextMenu={(event) => onContextMenu(event, task.taskId)}
            onEdit={() => onEdit(task.taskId)}
          />
        ))}
      </div>
    </div>
  );
};

export const ProjectKanbanPage = () => {
  const { projectId } = useParams();
  const { settings } = useSettings();
  const { setSelectedTask } = useUIStore();
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatusValue, setCreateStatusValue] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createType, setCreateType] = useState<Task["type"]>("Feature");
  const [createPriority, setCreatePriority] = useState<Task["priority"]>("P2");
  const [createSeverity, setCreateSeverity] = useState<Task["severity"] | "">("");
  const [createEffort, setCreateEffort] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createTags, setCreateTags] = useState<string[]>([]);
  const [createAssignee, setCreateAssignee] = useState("");
  const [createDependencies, setCreateDependencies] = useState("");
  const [createBlockedReason, setCreateBlockedReason] = useState("");
  const [createChecklist, setCreateChecklist] = useState("");
  const [createAttachments, setCreateAttachments] = useState("");
  const [createLinkedNotes, setCreateLinkedNotes] = useState("");
  const [createTimeLogs, setCreateTimeLogs] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<Task["type"]>("Feature");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("P2");
  const [editSeverity, setEditSeverity] = useState<Task["severity"] | "">("");
  const [editEffort, setEditEffort] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAssignee, setEditAssignee] = useState("");
  const [editDependencies, setEditDependencies] = useState("");
  const [editBlockedReason, setEditBlockedReason] = useState("");
  const [editChecklist, setEditChecklist] = useState("");
  const [editAttachments, setEditAttachments] = useState("");
  const [editLinkedNotes, setEditLinkedNotes] = useState("");
  const [editTimeLogs, setEditTimeLogs] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuSize, setMenuSize] = useState({ width: 180, height: 160 });
  const tasks =
    useLiveQuery<Task[]>(
      () => (projectId ? db.tasks.where("projectId").equals(projectId).toArray() : []),
      [projectId]
    ) ?? [];
  const tagOptions = useMemo(
    () => Array.from(new Set(tasks.flatMap((task) => task.tags))).sort(),
    [tasks]
  );

  const grouped = settings.statuses.reduce<Record<string, typeof tasks>>((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status);
    return acc;
  }, {});

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id.toString();
    const newStatus = over.id.toString();
    const task = tasks.find((item) => item.taskId === taskId);
    if (task && task.status !== newStatus) {
      await updateTask(taskId, { status: newStatus });
    }
  };

  const resetCreateFields = (status?: string) => {
    const fallbackStatus = status ?? settings.statuses[0] ?? "Backlog";
    setCreateStatusValue(fallbackStatus);
    setCreateTitle("");
    setCreateDescription("");
    setCreateType("Feature");
    setCreatePriority("P2");
    setCreateSeverity("");
    setCreateEffort("");
    setCreateStartDate("");
    setCreateDueDate("");
    setCreateTags([]);
    setCreateAssignee("");
    setCreateDependencies("");
    setCreateBlockedReason("");
    setCreateChecklist("");
    setCreateAttachments("");
    setCreateLinkedNotes("");
    setCreateTimeLogs("");
  };

  const handleAdd = (status: string) => {
    setCreateStatus(status);
    resetCreateFields(status);
    setCreateOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleDuplicate = async (taskId: string) => {
    await duplicateTask(taskId);
  };

  const handleInlineCreate = async () => {
    if (!projectId || !createTitle.trim()) return;
    await createTask({
      projectId,
      title: createTitle.trim(),
      description: createDescription.trim(),
      status: createStatusValue || createStatus || settings.statuses[0] || "Backlog",
      type: createType,
      priority: createPriority,
      severity: createSeverity || undefined,
      effort: parseEffort(createEffort),
      startDate: createStartDate || undefined,
      dueDate: createDueDate || undefined,
      tags: createTags,
      assignee: createAssignee || undefined,
      dependencies: parseCsv(createDependencies),
      blockedReason: createBlockedReason || undefined,
      checklist: parseChecklist(createChecklist),
      attachments: parseAttachments(createAttachments),
      linkedNoteIds: parseCsv(createLinkedNotes),
      timeLogs: parseTimeLogs(createTimeLogs),
    });
    setCreateOpen(false);
    setCreateStatus(null);
  };

  const handleEditStart = (taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;
    setEditTaskId(taskId);
    setEditStatus(task.status);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditType(task.type);
    setEditPriority(task.priority);
    setEditSeverity(task.severity ?? "");
    setEditEffort(task.effort?.toString() ?? "");
    setEditStartDate(task.startDate ?? "");
    setEditDueDate(task.dueDate ?? "");
    setEditTags(task.tags);
    setEditAssignee(task.assignee ?? "");
    setEditDependencies(task.dependencies.join(", "));
    setEditBlockedReason(task.blockedReason ?? "");
    setEditChecklist(checklistToText(task.checklist));
    setEditAttachments(attachmentsToText(task.attachments));
    setEditLinkedNotes(task.linkedNoteIds.join(", "));
    setEditTimeLogs(timeLogsToText(task.timeLogs));
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editTaskId || !editTitle.trim()) return;
    await updateTask(editTaskId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      status: editStatus || settings.statuses[0] || "Backlog",
      type: editType,
      priority: editPriority,
      severity: editSeverity || undefined,
      effort: parseEffort(editEffort),
      startDate: editStartDate || undefined,
      dueDate: editDueDate || undefined,
      tags: editTags,
      assignee: editAssignee || undefined,
      dependencies: parseCsv(editDependencies),
      blockedReason: editBlockedReason || undefined,
      checklist: parseChecklist(editChecklist),
      attachments: parseAttachments(editAttachments),
      linkedNoteIds: parseCsv(editLinkedNotes),
      timeLogs: parseTimeLogs(editTimeLogs),
    });
    setEditOpen(false);
    setEditTaskId(null);
  };

  const handleEditCancel = () => {
    setEditOpen(false);
    setEditTaskId(null);
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    if (createStatus) {
      setCreateStatusValue(createStatus);
    }
  }, [createStatus]);

  useLayoutEffect(() => {
    if (contextMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuSize({ width: rect.width, height: rect.height });
    }
  }, [contextMenu]);

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <Card className="p-4">
        <div className="text-sm text-base-content/60">
          Drag tasks between columns. Status columns are customizable in settings.
        </div>
      </Card>
      <DndContext onDragEnd={onDragEnd}>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
          {settings.statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={(grouped[status] ?? []).map((task) => ({
                taskId: task.taskId,
                title: task.title,
                priority: task.priority,
                type: task.type,
                tags: task.tags,
              }))}
              onAdd={() => handleAdd(status)}
              onDelete={(taskId) => handleDelete(taskId)}
              onDuplicate={(taskId) => handleDuplicate(taskId)}
              onStartInline={() => handleAdd(status)}
              onEdit={(taskId) => handleEditStart(taskId)}
              onContextMenu={(event, taskId) => {
                event.preventDefault();
                setContextMenu({ x: event.clientX, y: event.clientY, taskId });
              }}
            />
          ))}
        </div>
      </DndContext>
      {contextMenu && (() => {
        const margin = 12;
        const maxX = window.innerWidth - menuSize.width - margin;
        const maxY = window.innerHeight - menuSize.height - margin;
        const left = Math.max(margin, Math.min(contextMenu.x, maxX));
        const top = Math.max(margin, Math.min(contextMenu.y, maxY));
        return (
          <div
            ref={menuRef}
            className="fixed z-50 surface-overlay p-2 w-48 text-sm"
            style={{ left, top }}
          >
            <button
              className="w-full text-left px-2 py-1 rounded-md hover:bg-base-200/60 flex items-center gap-2"
              onClick={() => {
                setSelectedTask(contextMenu.taskId);
                setContextMenu(null);
              }}
            >
              <Eye size={14} /> Open details
            </button>
            <button
              className="w-full text-left px-2 py-1 rounded-md hover:bg-base-200/60 flex items-center gap-2"
              onClick={() => {
                handleEditStart(contextMenu.taskId);
                setContextMenu(null);
              }}
            >
              <Edit3 size={14} /> Edit task
            </button>
            <button
              className="w-full text-left px-2 py-1 rounded-md hover:bg-base-200/60 flex items-center gap-2"
              onClick={() => {
                handleDuplicate(contextMenu.taskId);
                setContextMenu(null);
              }}
            >
              <Copy size={14} /> Duplicate
            </button>
            <button
              className="w-full text-left px-2 py-1 rounded-md text-error hover:bg-base-200/60 flex items-center gap-2"
              onClick={() => {
                handleDelete(contextMenu.taskId);
                setContextMenu(null);
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        );
      })()}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateStatus(null);
            resetCreateFields();
          }
        }}
      >
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-base-200/60">
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4 max-h-[70vh] overflow-y-auto">
          <Tabs defaultValue="basics" className="space-y-4">
            <TabsList className="bg-base-200/60">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="basics" className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Title</label>
                <Input
                  placeholder="Task title"
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Description</label>
                <Textarea
                  rows={3}
                  placeholder="Short description"
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Status</label>
                  <Select
                    value={createStatusValue}
                    onChange={(event) => setCreateStatusValue(event.target.value)}
                  >
                    {settings.statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Type</label>
                  <Select value={createType} onChange={(event) => setCreateType(event.target.value as Task["type"])}>
                    {Object.keys(typeIconMap).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Priority</label>
                  <Select
                    value={createPriority}
                    onChange={(event) => setCreatePriority(event.target.value as Task["priority"])}
                  >
                    {["P0", "P1", "P2", "P3"].map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Severity</label>
                  <Select
                    value={createSeverity}
                    onChange={(event) => setCreateSeverity(event.target.value as Task["severity"])}
                  >
                    <option value="">—</option>
                    {["S1", "S2", "S3", "S4"].map((severity) => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Effort</label>
                  <Input
                    placeholder="S / M / L or points"
                    value={createEffort}
                    onChange={(event) => setCreateEffort(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Assignee</label>
                  <Input
                    placeholder="Name"
                    value={createAssignee}
                    onChange={(event) => setCreateAssignee(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Start Date</label>
                  <DatePicker
                    calendar={settings.calendar}
                    value={createStartDate || undefined}
                    onChange={(value) => setCreateStartDate(value ?? "")}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Due Date</label>
                  <DatePicker
                    calendar={settings.calendar}
                    value={createDueDate || undefined}
                    onChange={(value) => setCreateDueDate(value ?? "")}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Tags</label>
                <MultiSelect
                  options={tagOptions}
                  value={createTags}
                  onChange={setCreateTags}
                  placeholder="Add tags"
                  allowCreate
                />
              </div>
            </TabsContent>
            <TabsContent value="details" className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Dependencies (task IDs)</label>
                <Input
                  placeholder="uuid, uuid"
                  value={createDependencies}
                  onChange={(event) => setCreateDependencies(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Blocked Reason</label>
                <Input
                  placeholder="Why is this blocked?"
                  value={createBlockedReason}
                  onChange={(event) => setCreateBlockedReason(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Checklist (one per line)</label>
                <Textarea
                  rows={3}
                  placeholder="[ ] First item"
                  value={createChecklist}
                  onChange={(event) => setCreateChecklist(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">
                  Attachments (Label | URL per line)
                </label>
                <Textarea
                  rows={3}
                  placeholder="Spec | https://..."
                  value={createAttachments}
                  onChange={(event) => setCreateAttachments(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Linked Notes (note IDs)</label>
                <Input
                  placeholder="uuid, uuid"
                  value={createLinkedNotes}
                  onChange={(event) => setCreateLinkedNotes(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">
                  Time Logs (start,end,note per line)
                </label>
                <Textarea
                  rows={3}
                  placeholder="1700000000000,1700003600000,focus"
                  value={createTimeLogs}
                  onChange={(event) => setCreateTimeLogs(event.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button onClick={handleInlineCreate}>Create</Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditTaskId(null);
          }
        }}
      >
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-base-200/60">
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4 max-h-[70vh] overflow-y-auto">
          <Tabs defaultValue="basics" className="space-y-4">
            <TabsList className="bg-base-200/60">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="basics" className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Title</label>
                <Input
                  placeholder="Task title"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Description</label>
                <Textarea
                  rows={3}
                  placeholder="Short description"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Status</label>
                  <Select
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value)}
                  >
                    {settings.statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Type</label>
                  <Select value={editType} onChange={(event) => setEditType(event.target.value as Task["type"])}>
                    {Object.keys(typeIconMap).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Priority</label>
                  <Select
                    value={editPriority}
                    onChange={(event) => setEditPriority(event.target.value as Task["priority"])}
                  >
                    {["P0", "P1", "P2", "P3"].map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Severity</label>
                  <Select
                    value={editSeverity}
                    onChange={(event) => setEditSeverity(event.target.value as Task["severity"])}
                  >
                    <option value="">—</option>
                    {["S1", "S2", "S3", "S4"].map((severity) => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Effort</label>
                  <Input
                    placeholder="S / M / L or points"
                    value={editEffort}
                    onChange={(event) => setEditEffort(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Assignee</label>
                  <Input
                    placeholder="Name"
                    value={editAssignee}
                    onChange={(event) => setEditAssignee(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Start Date</label>
                  <DatePicker
                    calendar={settings.calendar}
                    value={editStartDate || undefined}
                    onChange={(value) => setEditStartDate(value ?? "")}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-base-content/50">Due Date</label>
                  <DatePicker
                    calendar={settings.calendar}
                    value={editDueDate || undefined}
                    onChange={(value) => setEditDueDate(value ?? "")}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Tags</label>
                <MultiSelect
                  options={tagOptions}
                  value={editTags}
                  onChange={setEditTags}
                  placeholder="Add tags"
                  allowCreate
                />
              </div>
            </TabsContent>
            <TabsContent value="details" className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Dependencies (task IDs)</label>
                <Input
                  placeholder="uuid, uuid"
                  value={editDependencies}
                  onChange={(event) => setEditDependencies(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Blocked Reason</label>
                <Input
                  placeholder="Why is this blocked?"
                  value={editBlockedReason}
                  onChange={(event) => setEditBlockedReason(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Checklist (one per line)</label>
                <Textarea
                  rows={3}
                  placeholder="[ ] First item"
                  value={editChecklist}
                  onChange={(event) => setEditChecklist(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">
                  Attachments (Label | URL per line)
                </label>
                <Textarea
                  rows={3}
                  placeholder="Spec | https://..."
                  value={editAttachments}
                  onChange={(event) => setEditAttachments(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">Linked Notes (note IDs)</label>
                <Input
                  placeholder="uuid, uuid"
                  value={editLinkedNotes}
                  onChange={(event) => setEditLinkedNotes(event.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-base-content/50">
                  Time Logs (start,end,note per line)
                </label>
                <Textarea
                  rows={3}
                  placeholder="1700000000000,1700003600000,focus"
                  value={editTimeLogs}
                  onChange={(event) => setEditTimeLogs(event.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button onClick={handleEditSubmit}>Save</Button>
            <Button variant="ghost" onClick={handleEditCancel}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </div>
  );
};
