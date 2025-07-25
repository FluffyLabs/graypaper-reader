import React from "react";
import ReactDOM from "react-dom/client";
import Modal from "react-modal";
import { App } from "./App.tsx";
import "./index.css";
import "./font.css";
import { LocationProvider } from "./components/LocationProvider/LocationProvider.tsx";
import { MetadataProvider } from "./components/MetadataProvider/MetadataProvider.tsx";

redirectToBeta("graypaper-reader.netlify.app");

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

/**
 * By opting in by setting `localStorage.BETA_REDIRECT` the user
 * can automatically be redirect to beta version of the tool.
 */
export function redirectToBeta(betaHost: string) {
  try {
    const shouldRedirectLocal = localStorage.getItem("BETA_REDIRECT");
    if (shouldRedirectLocal === null) {
      return;
    }
    const url = new URL(window.location.href);
    url.host = betaHost;
    window.location.href = url.toString();
  } catch (e) {
    console.warn(`Error redirecting to beta: ${e}`);
  }
}
