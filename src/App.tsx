import { useContext } from "react";
import "./App.css";

import { AppsSidebar, Header } from "@krystian5011/shared-ui";
import { CodeSyncProvider } from "./components/CodeSyncProvider/CodeSyncProvider";
import { DownloadPdfWithTheme } from "./components/DownloadThemedPdf/DownloadThemedPdf";
import { LightThemeToggle } from "./components/LightThemeToggle/LightThemeToggle";
import {
  type ILocationContext,
  LocationContext,
} from "./components/LocationProvider/LocationProvider";
import {
  type IMetadataContext,
  MetadataContext,
} from "./components/MetadataProvider/MetadataProvider";
import { NotesProvider } from "./components/NotesProvider/NotesProvider";
import { PdfProvider } from "./components/PdfProvider/PdfProvider";
import { PdfViewer } from "./components/PdfViewer/PdfViewer";
import { PinNotesToggle } from "./components/PinNotesToggle/PinNotesToggle";
import { Resizable } from "./components/Resizable/Resizable";
import { SelectionProvider } from "./components/SelectionProvider/SelectionProvider";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ZoomControls } from "./components/ZoomControls/ZoomControls";
import toolLogoUrl from "./assets/tool-logo.svg";
import { LightDarkThemeSyncer } from "./components/LightDarkThemeSyncer";

export function App() {
  const {
    locationParams: { version },
  } = useContext(LocationContext) as ILocationContext;

  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  return (
    <>
      <LightDarkThemeSyncer />
      <CodeSyncProvider>
        <NotesProvider>
          <PdfProvider pdfUrl={urlGetters.pdf(version)}>
            <SelectionProvider>
              <div>
                <Header toolNameSrc={toolLogoUrl} />
                <Resizable
                  left={
                    <div className="left-side-container">
                      <AppsSidebar
                        activeLink="reader"
                        enableDarkModeToggle={true}
                      />
                      <div className="pdf-viewer-container">
                        <PdfViewer />
                      </div>
                      <div className="controls">
                        <PinNotesToggle />
                        <LightThemeToggle />
                        <DownloadPdfWithTheme />
                        <ZoomControls />
                      </div>
                    </div>
                  }
                  right={<Sidebar />}
                />
              </div>
            </SelectionProvider>
          </PdfProvider>
        </NotesProvider>
      </CodeSyncProvider>
    </>
  );
}
