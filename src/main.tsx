import React from "react";
import ReactDOM from "react-dom/client";
import { LocationProvider } from "./components/LocationProvider/LocationProvider.tsx";
import { MetadataProvider } from "./components/MetadataProvider/MetadataProvider.tsx";
import { migrateLocalStorageKeys } from "./config/localStorageMigration";
import { initDevTools } from "./devtools/initDevTools";
import { installReadableStreamAsyncIteratorPolyfill } from "./utils/readableStreamAsyncIteratorPolyfill";
import { installRegExpEscapePolyfill } from "./utils/regExpEscapePolyfill";

// pdf.js search relies on `RegExp.escape`, which WebKit only added in iOS/Safari 18.4.
// Install the polyfill before anything renders so search works on older iOS (issue #446).
installRegExpEscapePolyfill();
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
