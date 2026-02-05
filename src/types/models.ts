export type ProjectStatus = "active" | "paused" | "archived";
export type TaskType = "Feature" | "Bug" | "Fix" | "Chore" | "Refactor" | "Research";
export type TaskPriority = "P0" | "P1" | "P2" | "P3";
export type TaskSeverity = "S1" | "S2" | "S3" | "S4";
export type TaskEffort = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface RepoLink {
  id: string;
  type: "github" | "gitlab" | "local" | "other";
  url: string;
}

export interface Project {
  projectId: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  techStack: string[];
  repoLinks: RepoLink[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskAttachment {
  id: string;
  label: string;
  url: string;
}

export interface TaskTimeLog {
  id: string;
  start: number;
  end?: number;
  note?: string;
}

export interface Task {
  taskId: string;
  projectId: string;
  title: string;
  description: string;
  type: TaskType;
  status: string;
  priority: TaskPriority;
  severity?: TaskSeverity;
  effort?: TaskEffort | number;
  startDate?: string;
  dueDate?: string;
  tags: string[];
  assignee?: string;
  dependencies: string[];
  blockedReason?: string;
  checklist: TaskChecklistItem[];
  attachments: TaskAttachment[];
  timeLogs: TaskTimeLog[];
  linkedNoteIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  noteId: string;
  projectId: string;
  title: string;
  content: string;
  tags: string[];
  linkedTaskIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SavedViewFilter {
  status?: string[];
  type?: TaskType[];
  priority?: TaskPriority[];
  tags?: string[];
  dueBefore?: string;
  dueAfter?: string;
  text?: string;
}

export interface SavedView {
  viewId: string;
  name: string;
  projectId?: string;
  filter: SavedViewFilter;
}

export interface Settings {
  id: "settings";
  theme: string;
  calendar: "gregorian" | "jalali";
  statuses: string[];
  fontFamily: string;
  monoFont: string;
  savedViews: SavedView[];
  backupReminder: boolean;
}

export interface ExportPayload {
  schemaVersion: number;
  exportedAt: number;
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  settings: Settings;
}
