import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./db";
import { createProject, createTask, createNote } from "./api";
import { exportData, importData } from "./importExport";

const resetDb = async () => {
  await db.delete();
  await db.open();
};

describe("import/export", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("exports and imports with replace", async () => {
    const project = await createProject({ name: "Alpha" });
    await createTask({ projectId: project.projectId, title: "Task Alpha" });
    await createNote({ projectId: project.projectId, title: "Note Alpha" });

    const payload = await exportData();

    await resetDb();
    await importData(payload, "replace");

    const projects = await db.projects.toArray();
    const tasks = await db.tasks.toArray();
    const notes = await db.notes.toArray();

    expect(projects.length).toBe(1);
    expect(tasks.length).toBe(1);
    expect(notes.length).toBe(1);
  });

  it("merges by id", async () => {
    const project = await createProject({ name: "Beta" });
    await createTask({ projectId: project.projectId, title: "Task Beta" });

    const payload = await exportData();

    await createProject({ name: "Gamma" });
    await importData(payload, "merge");

    const projects = await db.projects.toArray();
    expect(projects.length).toBeGreaterThanOrEqual(2);
  });
});
