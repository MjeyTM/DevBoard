import { db } from "./db";
import type { Note, Project, RepoLink, Task, TaskChecklistItem, TaskTimeLog } from "../types/models";
import { createId } from "../utils/uuid";
import { slugify } from "../utils/slug";

const now = () => Date.now();

export const createProject = async (input: {
  name: string;
  description?: string;
  status?: Project["status"];
  techStack?: string[];
  repoLinks?: RepoLink[];
}) => {
  const projectId = createId();
  const project: Project = {
    projectId,
    name: input.name,
    slug: slugify(input.name),
    description: input.description ?? "",
    status: input.status ?? "active",
    techStack: input.techStack ?? [],
    repoLinks: input.repoLinks ?? [],
    createdAt: now(),
    updatedAt: now(),
  };
  await db.projects.put(project);
  return project;
};

export const updateProject = async (projectId: string, updates: Partial<Project>) => {
  await db.projects.update(projectId, { ...updates, updatedAt: now() });
};

export const deleteProject = async (projectId: string) => {
  await db.tasks.where("projectId").equals(projectId).delete();
  await db.notes.where("projectId").equals(projectId).delete();
  await db.projects.delete(projectId);
};

export const createTask = async (input: {
  projectId: string;
  title: string;
  description?: string;
  type?: Task["type"];
  status?: string;
  priority?: Task["priority"];
  tags?: string[];
  severity?: Task["severity"];
  effort?: Task["effort"] | number;
  startDate?: string;
  dueDate?: string;
  assignee?: string;
  dependencies?: string[];
  blockedReason?: string;
  checklist?: Task["checklist"];
  attachments?: Task["attachments"];
  timeLogs?: Task["timeLogs"];
  linkedNoteIds?: string[];
}) => {
  const taskId = createId();
  const task: Task = {
    taskId,
    projectId: input.projectId,
    title: input.title,
    description: input.description ?? "",
    type: input.type ?? "Feature",
    status: input.status ?? "Backlog",
    priority: input.priority ?? "P2",
    severity: input.severity,
    effort: input.effort,
    startDate: input.startDate,
    dueDate: input.dueDate,
    tags: input.tags ?? [],
    assignee: input.assignee,
    dependencies: input.dependencies ?? [],
    blockedReason: input.blockedReason,
    checklist: input.checklist ?? [],
    attachments: input.attachments ?? [],
    timeLogs: input.timeLogs ?? [],
    linkedNoteIds: input.linkedNoteIds ?? [],
    createdAt: now(),
    updatedAt: now(),
  };
  await db.tasks.put(task);
  return task;
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  await db.tasks.update(taskId, { ...updates, updatedAt: now() });
};

export const deleteTask = async (taskId: string) => {
  await db.tasks.delete(taskId);
};

export const duplicateTask = async (taskId: string) => {
  const existing = await db.tasks.get(taskId);
  if (!existing) return;
  const copy: Task = {
    ...existing,
    taskId: createId(),
    title: `${existing.title} (Copy)`,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.tasks.put(copy);
  return copy;
};

export const convertChecklistItemToTask = async (
  taskId: string,
  checklistItem: TaskChecklistItem
) => {
  const task = await db.tasks.get(taskId);
  if (!task) return;
  const newTask = await createTask({
    projectId: task.projectId,
    title: checklistItem.text,
    description: `Converted from checklist of: ${task.title}`,
    status: task.status,
    priority: task.priority,
    type: task.type,
  });
  const updatedChecklist = task.checklist.filter((item) => item.id !== checklistItem.id);
  await updateTask(taskId, { checklist: updatedChecklist });
  return newTask;
};

export const startTimeLog = async (taskId: string) => {
  const task = await db.tasks.get(taskId);
  if (!task) return;
  const active = task.timeLogs.find((log) => !log.end);
  if (active) return;
  const timeLog: TaskTimeLog = { id: createId(), start: now() };
  await updateTask(taskId, { timeLogs: [...task.timeLogs, timeLog] });
};

export const stopTimeLog = async (taskId: string) => {
  const task = await db.tasks.get(taskId);
  if (!task) return;
  const updated = task.timeLogs.map((log) => (log.end ? log : { ...log, end: now() }));
  await updateTask(taskId, { timeLogs: updated });
};

export const createNote = async (input: {
  projectId: string;
  title: string;
  content?: string;
  tags?: string[];
}) => {
  const noteId = createId();
  const note: Note = {
    noteId,
    projectId: input.projectId,
    title: input.title,
    content: input.content ?? "",
    tags: input.tags ?? [],
    linkedTaskIds: [],
    createdAt: now(),
    updatedAt: now(),
  };
  await db.notes.put(note);
  return note;
};

export const updateNote = async (noteId: string, updates: Partial<Note>) => {
  await db.notes.update(noteId, { ...updates, updatedAt: now() });
};

export const deleteNote = async (noteId: string) => {
  await db.notes.delete(noteId);
};
