import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { db } from "../data/db";
import { createNote } from "../data/api";
import { useUIStore } from "../stores/uiStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import type { Note } from "../types/models";
import { ProjectHeader } from "../components/layout/ProjectHeader";

export const ProjectNotesPage = () => {
  const { projectId } = useParams();
  const { selectedNoteId, setSelectedNote } = useUIStore();
  const [query, setQuery] = useState("");

  const notes =
    useLiveQuery<Note[]>(
      () => (projectId ? db.notes.where("projectId").equals(projectId).toArray() : []),
      [projectId]
    ) ?? [];

  const filtered = useMemo(
    () => notes.filter((note) => note.title.toLowerCase().includes(query.toLowerCase())),
    [notes, query]
  );

  const current = notes.find((note) => note.noteId === selectedNoteId) ?? notes[0];

  useEffect(() => {
    if (!selectedNoteId && notes[0]) {
      setSelectedNote(notes[0].noteId);
    }
  }, [notes, selectedNoteId, setSelectedNote]);

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4">
      <div className="md:col-span-2">
        <ProjectHeader />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input placeholder="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => projectId && createNote({ projectId, title: "New Note" })}
          >
            New
          </Button>
        </div>
        <div className="space-y-2">
          {filtered.map((note) => (
            <button
              key={note.noteId}
              type="button"
              onClick={() => setSelectedNote(note.noteId)}
              className={`w-full nav-item nav-item-hover text-left ${
                note.noteId === current?.noteId ? "nav-item-active" : ""
              }`}
            >
              <div className="text-sm font-medium">{note.title}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {note.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="surface-card p-4">
        {current ? (
          <div>
            <div className="text-lg font-semibold mb-2">{current.title}</div>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {current.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-sm text-base-content/60">Select a note to preview.</div>
        )}
      </div>
    </div>
  );
};
