import React from "react";
import ReactDOM from "react-dom/client";
import Modal from "react-modal";
import { App } from "./App.tsx";
import { LocationProvider } from "./components/LocationProvider/LocationProvider.tsx";
import { MetadataProvider } from "./components/MetadataProvider/MetadataProvider.tsx";

import "@krystian5011/shared-ui/style.css";
import "./tailwind.css";
import "./variables.css";
import "./index.css";
import "./font.css";

Modal.setAppElement("#root");

ReactDOM.createRoot(document.getElementById("root") ?? document.body).render(
  <React.StrictMode>
    <MetadataProvider>
      <LocationProvider>
        <App />
      </LocationProvider>
    </MetadataProvider>
  </React.StrictMode>,
);
