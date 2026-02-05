import { describe, it, expect, beforeEach } from "vitest";
import { db, ensureSettings } from "./db";
import { createProject, createTask, createNote } from "./api";

const resetDb = async () => {
  await db.delete();
  await db.open();
};

describe("db", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates default settings", async () => {
    await ensureSettings();
    const settings = await db.settings.get("settings");
    expect(settings).toBeTruthy();
    expect(settings?.calendar).toBeDefined();
  });

  it("creates project with tasks and notes", async () => {
    const project = await createProject({ name: "Test Project" });
    await createTask({ projectId: project.projectId, title: "Task A" });
    await createNote({ projectId: project.projectId, title: "Note A" });

    const projects = await db.projects.toArray();
    const tasks = await db.tasks.where("projectId").equals(project.projectId).toArray();
    const notes = await db.notes.where("projectId").equals(project.projectId).toArray();

    expect(projects.length).toBe(1);
    expect(tasks.length).toBe(1);
    expect(notes.length).toBe(1);
  });
});
