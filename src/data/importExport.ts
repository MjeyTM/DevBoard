import type { ExportPayload } from "../types/models";
import { db, DB_SCHEMA_VERSION, defaultSettings } from "./db";

export const exportData = async (): Promise<ExportPayload> => {
  const [projects, tasks, notes, settings] = await Promise.all([
    db.projects.toArray(),
    db.tasks.toArray(),
    db.notes.toArray(),
    db.settings.get("settings"),
  ]);

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    exportedAt: Date.now(),
    projects,
    tasks,
    notes,
    settings: settings ?? defaultSettings,
  };
};

export const importData = async (
  payload: ExportPayload,
  mode: "replace" | "merge"
) => {
  if (payload.schemaVersion > DB_SCHEMA_VERSION) {
    throw new Error("Unsupported schema version");
  }

  if (mode === "replace") {
    await db.transaction("rw", db.projects, db.tasks, db.notes, db.settings, async () => {
      await db.projects.clear();
      await db.tasks.clear();
      await db.notes.clear();
      await db.settings.clear();
      await db.projects.bulkPut(payload.projects);
      await db.tasks.bulkPut(payload.tasks);
      await db.notes.bulkPut(payload.notes);
      await db.settings.put(payload.settings ?? defaultSettings);
    });
    return;
  }

  await db.transaction("rw", db.projects, db.tasks, db.notes, db.settings, async () => {
    await db.projects.bulkPut(payload.projects);
    await db.tasks.bulkPut(payload.tasks);
    await db.notes.bulkPut(payload.notes);
    if (payload.settings) {
      await db.settings.put(payload.settings);
    }
  });
};
