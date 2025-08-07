// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url"; // <--- Add this import

// Use this to resolve the path correctly in Vercel's environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // <--- Add './' to the path
      "@shared": path.resolve(__dirname, "./shared"), // <--- Add './' to the path
      "@assets": path.resolve(__dirname, "./attached_assets"), // <--- Add './' to the path
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
