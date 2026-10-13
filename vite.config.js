import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` makes the normal Vercel site in dist/.
// `npm run build:single` inlines everything into one HTML file (used for the claude.ai preview).
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  build: { outDir: mode === "single" ? "dist-single" : "dist", assetsInlineLimit: mode === "single" ? 100000000 : 4096 }
}));
