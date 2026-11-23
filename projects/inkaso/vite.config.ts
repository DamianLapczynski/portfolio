import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build lands in /inkaso at the repo root, so GitHub Pages serves it at /portfolio/inkaso/.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "../../inkaso", emptyOutDir: true },
});
