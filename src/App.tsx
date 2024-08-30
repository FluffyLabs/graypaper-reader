import { useCallback, useEffect, useState } from "react";
import "./App.css";

import { Banner } from "./components/Banner/Banner";
import { CodeSyncProvider } from "./components/CodeSyncProvider/CodeSyncProvider";
import { PdfProvider } from "./components/PdfProvider/PdfProvider";
import { PdfViewer } from "./components/PdfViewer/PdfViewer";
import { Resizable } from "./components/Resizable/Resizable";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ThemeToggler } from "./components/ThemeToggler/ThemeToggler";
import type { IframeController } from "./utils/IframeController";
import { type Metadata, codeUrl, getInitialVersion, getMetadata, grayPaperUrl, synctexUrl } from "./utils/metadata";
import { NotesProvider } from "./components/NotesProvider/NotesProvider";

export function App() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  useEffect(() => {
    const fetch = async () => {
      setMetadata(await getMetadata());
    };
    fetch();
  }, []);

  return metadata && <InnerApp metadata={metadata} />;
}

function InnerApp({ metadata }: { metadata: Metadata }) {
  const [loadedFrame, setLoadedFrame] = useState<IframeController | null>(null);
  const [version, setVersion] = useState(getInitialVersion(metadata));
  const browserZoom = useBrowserZoom();

  const onSetVersion = useCallback(
    (v: string) => {
      if (v !== version) {
        setLoadedFrame(null);
      }
      setVersion(v);
    },
    [version]
  );

  return (
    <NotesProvider>
      <PdfProvider pdfUrl={grayPaperUrl(version)}>
        <CodeSyncProvider synctexUrl={synctexUrl(version)} codeUrl={codeUrl(version)}>
          <Resizable
            left={
              <>
                <Banner />
                {loadedFrame && <ThemeToggler iframeCtrl={loadedFrame} />}
                <div className="pdf-viewer-container">
                  <PdfViewer />
                </div>
              </>
            }
            right={
              <Sidebar
                metadata={metadata}
                selectedVersion={version}
                onVersionChange={onSetVersion}
                zoom={browserZoom}
              />
            }
          />
        </CodeSyncProvider>
      </PdfProvider>
    </NotesProvider>
  );
}

function useBrowserZoom() {
  const [initialPixelRatio, _] = useState(window.devicePixelRatio > 2.0 ? 2.0 : window.devicePixelRatio);
  const [browserZoom, setBrowserZoom] = useState(window.devicePixelRatio / initialPixelRatio);

  useEffect(() => {
    const $styles = document.createElement("style");
    $styles.type = "text/css";
    document.head.appendChild($styles);
    const listener = () => {
      const zoom = window.devicePixelRatio / initialPixelRatio;
      $styles.textContent = `.no-zoom { transform-origin: top left; transform: scale(${1.0 / zoom}); }`;
      setBrowserZoom(zoom);
    };
    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [initialPixelRatio]);

  return browserZoom;
}
