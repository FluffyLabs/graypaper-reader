import type { Plugin } from "vite";

export function webmanifestPlugin(env: Record<string, string>): Plugin {
  const docName = env.VITE_DOC_NAME || "Gray Paper";
  return {
    name: "generate-webmanifest",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "site.webmanifest",
        source: JSON.stringify({
          name: `${docName} Reader`,
          short_name: docName,
          icons: [
            { src: "android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
          ],
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
        }),
      });
    },
  };
}
