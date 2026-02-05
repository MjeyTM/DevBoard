import MiniSearch from "minisearch";
import type { Note, Project, Task } from "../types/models";

export type SearchDocument = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId: string;
  source: "task" | "note" | "project";
};

export const buildSearchIndex = (projects: Project[], tasks: Task[], notes: Note[]) => {
  const miniSearch = new MiniSearch<SearchDocument>({
    fields: ["title", "content", "tags"],
    storeFields: ["id", "title", "projectId", "source"],
    searchOptions: {
      boost: { title: 2 },
      prefix: true,
      fuzzy: 0.2,
    },
  });

  const docs: SearchDocument[] = [
    ...projects.map((project) => ({
      id: project.projectId,
      title: project.name,
      content: project.description,
      tags: project.techStack,
      projectId: project.projectId,
      source: "project" as const,
    })),
    ...tasks.map((task) => ({
      id: task.taskId,
      title: task.title,
      content: task.description,
      tags: task.tags,
      projectId: task.projectId,
      source: "task" as const,
    })),
    ...notes.map((note) => ({
      id: note.noteId,
      title: note.title,
      content: note.content,
      tags: note.tags,
      projectId: note.projectId,
      source: "note" as const,
    })),
  ];

  miniSearch.addAll(docs);
  return miniSearch;
};
