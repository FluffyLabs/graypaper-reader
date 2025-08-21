import { useContext } from "react";
import "./App.css";

import { AppsSidebar } from "@fluffylabs/shared-ui";
import { CodeSyncProvider } from "./components/CodeSyncProvider/CodeSyncProvider";
import { DownloadPdfWithTheme } from "./components/DownloadThemedPdf/DownloadThemedPdf";
import { Header } from "./components/Header/Header";
import { LightThemeToggle } from "./components/LightThemeToggle/LightThemeToggle";
import { type ILocationContext, LocationContext } from "./components/LocationProvider/LocationProvider";
import { type IMetadataContext, MetadataContext } from "./components/MetadataProvider/MetadataProvider";
import { NotesProvider } from "./components/NotesProvider/NotesProvider";
import { PdfProvider } from "./components/PdfProvider/PdfProvider";
import { PdfViewer } from "./components/PdfViewer/PdfViewer";
import { PinNotesToggle } from "./components/PinNotesToggle/PinNotesToggle";
import { Resizable } from "./components/Resizable/Resizable";
import { SelectionProvider } from "./components/SelectionProvider/SelectionProvider";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ZoomControls } from "./components/ZoomControls/ZoomControls";

export function App() {
  const {
    locationParams: { version },
  } = useContext(LocationContext) as ILocationContext;

  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  return (
    <>
      <CodeSyncProvider>
        <NotesProvider>
          <PdfProvider pdfUrl={urlGetters.pdf(version)}>
            <SelectionProvider>
              <div>
                <Header />
                <Resizable
                  left={
                    <div className="h-full w-full flex flex-row items-stretch justify-center">
                      <AppsSidebar activeLink="reader" enableDarkModeToggle={true} />
                      <div className="box-border h-full w-full relative overflow-hidden bg-background">
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
