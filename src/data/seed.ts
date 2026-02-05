import { createNote, createProject, createTask } from "./api";
import { db } from "./db";
import { createId } from "../utils/uuid";

export const seedDemoData = async () => {
  const count = await db.projects.count();
  if (count > 0) return;

  const project = await createProject({
    name: "DevBoard",
    description: "Offline programmer project manager",
    techStack: ["React", "TypeScript", "Dexie"],
  });

  await createTask({
    projectId: project.projectId,
    title: "Build Dexie schema",
    description: "Define projects/tasks/notes tables + indexes.",
    type: "Feature",
    priority: "P1",
    status: "In Progress",
  });

  const task2 = await createTask({
    projectId: project.projectId,
    title: "Design Kanban board",
    description: "Dnd-kit columns with custom statuses.",
    type: "Feature",
    priority: "P2",
    status: "Backlog",
  });

  await db.tasks.update(task2.taskId, {
    tags: ["ui", "drag-drop"],
    checklist: [
      { id: createId(), text: "Define status columns", done: true },
      { id: createId(), text: "Add drag handlers", done: false },
    ],
  });

  await createNote({
    projectId: project.projectId,
    title: "Feature Spec - DevBoard",
    content: "# DevBoard\n\nOffline-first project manager for solo devs.\n\n## Goals\n- Fast\n- Local-first\n- Beautiful UX\n",
    tags: ["spec"],
  });
};
