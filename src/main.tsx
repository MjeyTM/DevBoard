import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import "highlight.js/styles/github.css";
import { ensureSettings } from "./data/db";
import { seedDemoData } from "./data/seed";
import { registerSW } from "virtual:pwa-register";

const init = async () => {
  await ensureSettings();
  await seedDemoData();
};

init();

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
