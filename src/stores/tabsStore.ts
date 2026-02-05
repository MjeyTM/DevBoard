import { create } from "zustand";
import { createId } from "../utils/uuid";

export type AppTab = {
  id: string;
  title: string;
  path: string;
};

interface TabsState {
  tabs: AppTab[];
  activeId?: string;
  replaceActive: (tab: Omit<AppTab, "id">) => void;
  createTab: (tab: Omit<AppTab, "id">) => string;
  closeTab: (id: string) => void;
  setActive: (id?: string) => void;
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeId: undefined,
  replaceActive: (tab) =>
    set((state) => {
      if (!state.activeId) {
        const next = { id: createId(), ...tab };
        return { tabs: [next], activeId: next.id };
      }
      const updated = state.tabs.map((item) =>
        item.id === state.activeId ? { ...item, ...tab } : item
      );
      return { tabs: updated };
    }),
  createTab: (tab) => {
    const next = { id: createId(), ...tab };
    set((state) => ({ tabs: [...state.tabs, next], activeId: next.id }));
    return next.id;
  },
  closeTab: (id) =>
    set((state) => {
      const idx = state.tabs.findIndex((tab) => tab.id === id);
      if (idx === -1) return state;
      const nextTabs = state.tabs.filter((tab) => tab.id !== id);
      if (state.activeId !== id) return { tabs: nextTabs };
      const fallback = nextTabs[idx - 1] ?? nextTabs[0];
      return { tabs: nextTabs, activeId: fallback?.id };
    }),
  setActive: (id) => set({ activeId: id }),
}));
