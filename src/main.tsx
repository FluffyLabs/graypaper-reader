import React from "react";
import ReactDOM from "react-dom/client";
import Modal from "react-modal";
import { LocationProvider } from "./components/LocationProvider/LocationProvider.tsx";
import { MetadataProvider } from "./components/MetadataProvider/MetadataProvider.tsx";
import { initDevTools } from "./devtools/initDevTools";

import "./tailwind.css";
import "@fluffylabs/shared-ui/style.css";
import "./variables.css";
import "./index.css";
import "./font.css";

import { App } from "./App.tsx";

Modal.setAppElement("#root");

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
