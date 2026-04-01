import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import prefetchChunk from "vite-plugin-prefetch-chunk";
import { webmanifestPlugin } from "./src/config/webmanifestPlugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: env.VITE_DOC_BASE_PATH || "/",
    plugins: [react(), prefetchChunk(), tailwindcss(), webmanifestPlugin(env)],
  };
});
