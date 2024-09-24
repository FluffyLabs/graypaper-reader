import { useContext } from "react";
import "./App.css";

import { Banner } from "./components/Banner/Banner";
import { CodeSyncProvider } from "./components/CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "./components/LocationProvider/LocationProvider";
import { type IMetadataContext, MetadataContext } from "./components/MetadataProvider/MetadataProvider";
import { NotesProvider } from "./components/NotesProvider/NotesProvider";
import { PdfProvider } from "./components/PdfProvider/PdfProvider";
import { PdfViewer } from "./components/PdfViewer/PdfViewer";
import { Resizable } from "./components/Resizable/Resizable";
import { SelectionProvider } from "./components/SelectionProvider/SelectionProvider";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ZoomControls } from "./components/ZoomControls/ZoomControls";
import { useBrowserZoom } from "./hooks/useBrowserZoom";

export function App() {
  const {
    locationParams: { version },
  } = useContext(LocationContext) as ILocationContext;
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;
  const browserZoom = useBrowserZoom();

  return (
    <NotesProvider>
      <PdfProvider pdfUrl={urlGetters.pdf(version)}>
        <CodeSyncProvider synctexUrl={urlGetters.synctex(version)} texDirectory={urlGetters.texDirectory(version)}>
          <SelectionProvider>
            <Resizable
              left={
                <>
                  <Banner />
                  <div className="pdf-viewer-container">
                    <PdfViewer key={version} />
                  </div>
                  <ZoomControls />
                </>
              }
              right={<Sidebar zoom={browserZoom} />}
            />
          </SelectionProvider>
        </CodeSyncProvider>
      </PdfProvider>
    </NotesProvider>
  );
}
