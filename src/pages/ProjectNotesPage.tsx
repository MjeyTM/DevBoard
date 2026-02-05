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
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  const tagOptions = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags))), [notes]);
  const tagCount = tagOptions.length;
  const lastUpdated = notes[0] ? new Date(notes[0].updatedAt).toLocaleString() : "—";

  useEffect(() => {
    if (!selectedNoteId && notes[0]) {
      setSelectedNote(notes[0].noteId);
    }
  }, [notes, selectedNoteId, setSelectedNote]);

  return (
    <div className="space-y-4">
      <ProjectHeader />
      <div className="grid gap-4 lg:grid-cols-12 auto-rows-[minmax(140px,auto)]">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Search & Create</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => projectId && createNote({ projectId, title: "New Note" })}
            >
              New Note
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Notes Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-base-content/70">
            <div className="text-2xl font-semibold text-base-content">{notes.length}</div>
            <div>Unique tags: {tagCount}</div>
            <div>Last updated: {lastUpdated}</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Quick Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {tagCount === 0 ? (
              <div className="text-sm text-base-content/60">No tags yet</div>
            ) : (
              tagOptions.slice(0, 10).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 lg:row-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[420px] overflow-auto">
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 lg:row-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
