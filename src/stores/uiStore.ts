import { create } from "zustand";

interface UIState {
  selectedTaskId?: string;
  selectedNoteId?: string;
  commandPaletteOpen: boolean;
  inspectorTab: "task" | "note";
  setSelectedTask: (taskId?: string) => void;
  setSelectedNote: (noteId?: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setInspectorTab: (tab: "task" | "note") => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTaskId: undefined,
  selectedNoteId: undefined,
  commandPaletteOpen: false,
  inspectorTab: "task",
  setSelectedTask: (taskId) =>
    set({ selectedTaskId: taskId, selectedNoteId: undefined, inspectorTab: "task" }),
  setSelectedNote: (noteId) =>
    set({ selectedNoteId: noteId, selectedTaskId: undefined, inspectorTab: "note" }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),
}));
