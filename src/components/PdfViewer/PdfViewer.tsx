import "pdfjs-dist/web/pdf_viewer.css";
import "./PdfViewer.css";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { useCallback, useContext, useEffect, useState } from "react";
import { NoteRenderer } from "../NoteRenderer/NoteRenderer";
import { PdfContext } from "../PdfProvider/PdfProvider";
import type { IPdfContext } from "../PdfProvider/PdfProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { SelectionRenderer } from "../SelectionRenderer/SelectionRenderer";

const IMAGE_RESOURCES_PATH = "pdf-viewer-images/";

export function PdfViewer() {
  const [rootElement, setRootElement] = useState<HTMLDivElement>();
  const [pagesLoaded, setPagesLoaded] = useState<boolean>(false);
  const { eventBus, linkService, findController, pdfDocument, setViewer } = useContext(PdfContext) as IPdfContext;
  const { handleViewerMouseDown, handleViewerMouseUp } = useContext(SelectionContext) as ISelectionContext;

  const handleRootRef = useCallback((element: HTMLDivElement) => {
    setRootElement(element);
  }, []);

  useEffect(() => {
    async function loadViewer() {
      if (!rootElement || !pdfDocument || !eventBus || !linkService) return;

      rootElement.innerHTML = "";
      const viewerContainer = document.createElement("div");
      viewerContainer.classList.add("pdfViewer");
      rootElement.appendChild(viewerContainer);

      const pdfViewer = new pdfJsViewer.PDFViewer({
        container: rootElement,
        eventBus,
        linkService,
        findController,
        imageResourcesPath: IMAGE_RESOURCES_PATH,
      });

      setViewer(pdfViewer);

      linkService.setViewer(pdfViewer);

      pdfViewer.setDocument(pdfDocument);

      eventBus.on("pagesloaded", () => {
        setPagesLoaded(true);
      });
    }

    if (rootElement) {
      loadViewer();
    }

    return () => {
      setViewer(undefined);
      setPagesLoaded(false);
    };
  }, [rootElement, eventBus, linkService, findController, pdfDocument, setViewer]);

  if (!pdfDocument) return <div>Loading...</div>;

  return (
    <>
      <div
        ref={handleRootRef}
        className="pdf-viewer-root"
        onMouseDown={handleViewerMouseDown}
        onMouseUp={handleViewerMouseUp}
      >
        {pagesLoaded ? (
          <>
            <NoteRenderer />
            <SelectionRenderer />
          </>
        ) : null}
      </div>
    </>
  );
}
