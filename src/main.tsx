import React from "react";
import ReactDOM from "react-dom/client";
import { LocationProvider } from "./components/LocationProvider/LocationProvider.tsx";
import { MetadataProvider } from "./components/MetadataProvider/MetadataProvider.tsx";
import { migrateLocalStorageKeys } from "./config/localStorageMigration";
import { initDevTools } from "./devtools/initDevTools";
import { installReadableStreamAsyncIteratorPolyfill } from "./utils/readableStreamAsyncIteratorPolyfill";

// pdf.js text extraction uses ReadableStream async iteration, which is missing in some Safari versions.
// Install the polyfill before anything renders so search works there (issue #446).
installReadableStreamAsyncIteratorPolyfill();

import "./tailwind.css";
import "./variables.css";
import "./index.css";
import "./font.css";

import { App } from "./App.tsx";
import { VersionProvider } from "./components/LocationProvider/VersionProvider.tsx";

try {
  migrateLocalStorageKeys();
} catch (e) {
  console.warn("Local storage migration skipped", e);
}
initDevTools();

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <React.StrictMode>
    <MetadataProvider>
      <LocationProvider>
        <VersionProvider>
          <App />
        </VersionProvider>
      </LocationProvider>
    </MetadataProvider>
  </React.StrictMode>,
);
