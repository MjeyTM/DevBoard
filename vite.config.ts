import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: (() => {
    const plugins = [react()];
    const pwaEnabled = process.env.PWA_DISABLE !== "1";
    if (pwaEnabled) {
      plugins.push(
        VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["favicon.svg"],
          manifest: {
            name: "DevBoard",
            short_name: "DevBoard",
            description: "Offline Programmer Project Manager",
            theme_color: "#111827",
            background_color: "#0b0f19",
            display: "standalone",
            start_url: "/",
            icons: [
              {
                src: "pwa-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
              {
                src: "pwa-512x512.png",
                sizes: "512x512",
                type: "image/png",
              },
            ],
          },
          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            navigateFallback: "/index.html",
          },
        })
      );
    }
    return plugins;
  })(),
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
