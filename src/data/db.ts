import Dexie, { Table } from "dexie";
import type { Note, Project, Settings, Task } from "../types/models";

export const DB_SCHEMA_VERSION = 1;

export const DEFAULT_STATUSES = [
  "Backlog",
  "Planned",
  "In Progress",
  "Blocked",
  "Review",
  "Done",
  "Archived",
];

export const defaultSettings: Settings = {
  id: "settings",
  theme: "system",
  calendar: "gregorian",
  statuses: DEFAULT_STATUSES,
  fontFamily: "system",
  monoFont: "JetBrains Mono",
  savedViews: [],
  backupReminder: true,
};

export class DevBoardDB extends Dexie {
  projects!: Table<Project, string>;
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("devboard");
    this.version(1).stores({
      projects: "projectId, status, updatedAt, *techStack",
      tasks: "taskId, projectId, status, dueDate, updatedAt, type, priority, *tags",
      notes: "noteId, projectId, updatedAt, *tags",
      settings: "id",
    });
  }
}

export const db = new DevBoardDB();

export const ensureSettings = async () => {
  const existing = await db.settings.get("settings");
  if (!existing) {
    await db.settings.put(defaultSettings);
  }
};
