import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite proxies /api/* to the Express server (server/index.js).
// Keep the proxy target in sync with .env PORT (default 5050).
const API_PORT = process.env.PORT || 5050;
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
