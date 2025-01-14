import React from "react";
import ReactDOM from "react-dom/client";
import Modal from "react-modal";
import { App } from "./App.tsx";
import "./index.css";
import "./font.css";
import { LocationProvider } from "./components/LocationProvider/LocationProvider.tsx";
import { MetadataProvider } from "./components/MetadataProvider/MetadataProvider.tsx";

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
