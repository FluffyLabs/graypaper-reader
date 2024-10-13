import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import prefetchChunk from "vite-plugin-prefetch-chunk";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), prefetchChunk()],
});
