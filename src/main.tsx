import React from "react";
import ReactDOM from "react-dom/client";
import { LocationProvider } from "./components/LocationProvider/LocationProvider.tsx";
import { MetadataProvider } from "./components/MetadataProvider/MetadataProvider.tsx";
import { initDevTools } from "./devtools/initDevTools";

import "./tailwind.css";
import "./variables.css";
import "./index.css";
import "./font.css";

import { App } from "./App.tsx";

initDevTools();

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <React.StrictMode>
    <MetadataProvider>
      <LocationProvider>
        <App />
      </LocationProvider>
    </MetadataProvider>
  </React.StrictMode>,
);
