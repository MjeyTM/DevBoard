import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { InspectorPanel } from "./InspectorPanel";
import { CommandPalette } from "../CommandPalette";

export const AppLayout = () => {
  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto] md:grid-rows-1 app-shell">
      <Sidebar />
      <div className="flex flex-col h-full">
        <TopBar />
        <main className="flex-1 overflow-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
      <InspectorPanel />
      <CommandPalette />
    </div>
  );
};
