import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import { buildSearchIndex } from "../data/search";

export const useSearch = (query: string) => {
  const projects = useLiveQuery(() => db.projects.toArray(), [], []) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []) ?? [];
  const notes = useLiveQuery(() => db.notes.toArray(), [], []) ?? [];

  const index = useMemo(() => buildSearchIndex(projects, tasks, notes), [projects, tasks, notes]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return index.search(query).map((result) => ({
      id: result.id,
      title: result.title,
      projectId: result.projectId,
      source: result.source,
      score: result.score,
    }));
  }, [index, query]);

  return { results, projects, tasks, notes };
};
