import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectCalendarPage } from "./pages/ProjectCalendarPage";
import { ProjectKanbanPage } from "./pages/ProjectKanbanPage";
import { ProjectListPage } from "./pages/ProjectListPage";
import { ProjectNotesPage } from "./pages/ProjectNotesPage";
import { SettingsPage } from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: "project/:projectId",
        children: [
          { index: true, element: <Navigate to="kanban" replace /> },
          { path: "kanban", element: <ProjectKanbanPage /> },
          { path: "list", element: <ProjectListPage /> },
          { path: "calendar", element: <ProjectCalendarPage /> },
          { path: "notes", element: <ProjectNotesPage /> },
        ],
      },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
