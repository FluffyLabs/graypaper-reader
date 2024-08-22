import "pdfjs-dist/web/pdf_viewer.css";
import "./PdfViewer.css";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { useCallback, useContext, useEffect, useState } from "react";
import type { MouseEventHandler } from "react";
import { CodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import type { ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { NoteRenderer } from "../NoteRenderer/NoteRenderer";
import type { TAnyNote } from "../NoteRenderer/NoteRenderer";
import { PdfContext } from "../PdfProvider/PdfProvider";
import type { IPdfContext } from "../PdfProvider/PdfProvider";

const MOCK_NOTES: TAnyNote[] = [
  {
    content: "free-floating note",
    date: 1724146563065,
    author: "Sebastian",
    pageNumber: 1,
    left: 0.6666666,
    top: 0.5,
  },
  {
    content: "highlight note",
    date: 1724146564017,
    author: "Sebastian",
    pageNumber: 1,
    line: 16,
    fileId: 188,
  },
  {
    content: "highlight note 2",
    date: 1724146564681,
    author: "Sebastian",
    pageNumber: 1,
    line: 8,
    fileId: 188,
  },
];
const IMAGE_RESOURCES_PATH = "pdf-viewer-images/";

export function PdfViewer() {
  const [rootElement, setRootElement] = useState<HTMLDivElement>();
  const [pdfJsViewerInstance, setPdfJsViewerInstance] = useState<pdfJsViewer.PDFViewer>();
  const { getSourceLocationByCoordinates } = useContext(CodeSyncContext) as ICodeSyncContext;
  const { eventBus, linkService, findController, pdfDocument } = useContext(PdfContext) as IPdfContext;

  const handleRootRef = useCallback((element: HTMLDivElement) => {
    setRootElement(element);
  }, []);

  useEffect(() => {
    async function loadViewer() {
      if (!rootElement) return;

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

      setPdfJsViewerInstance(pdfViewer);

      linkService.setViewer(pdfViewer);

      pdfViewer.setDocument(pdfDocument);
    }

    if (rootElement) {
      loadViewer();
    }
  }, [rootElement, eventBus, linkService, findController, pdfDocument]);

  const handleDoubleClick = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      const pageElement = (event.target as HTMLElement).closest(".page") as HTMLElement;
      if (!pageElement || !pageElement.dataset.pageNumber) return;

      const pageNumber = Number.parseInt(pageElement.dataset.pageNumber);

      const pageCanvas = pageElement.querySelector("canvas");
      if (!pageCanvas) return;

      const pageBoundingRect = pageCanvas.getBoundingClientRect();

      const left = (event.clientX - pageBoundingRect.left) / pageBoundingRect.width;
      const top = (event.clientY - pageBoundingRect.top) / pageBoundingRect.height;

      const sourceLocation = getSourceLocationByCoordinates(left, top, pageNumber);

      if (sourceLocation) {
        console.log(sourceLocation.fileId, sourceLocation.line);
      }
    },
    [getSourceLocationByCoordinates]
  );

  return (
    <div ref={handleRootRef} className="pdf-viewer-root" onDoubleClick={handleDoubleClick}>
      {pdfJsViewerInstance && rootElement && (
        <NoteRenderer notes={MOCK_NOTES} pdfJsViewerInstance={pdfJsViewerInstance} viewerRoot={rootElement} />
      )}
    </div>
  );
}
