import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Pure static frontend — no backend, no /api proxy. All AI/auth/media
// logic runs in the browser (see src/lib/localBackend).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
