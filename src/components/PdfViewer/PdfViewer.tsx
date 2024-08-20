import "pdfjs-dist/web/pdf_viewer.css";
import "./PdfViewer.css";
import { useCallback, useContext, useEffect, useState } from "react";
import * as pdfJs from "pdfjs-dist";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { NoteRenderer } from "../NoteRenderer/NoteRenderer";
import { CodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import type { MouseEventHandler } from "react";
import type { TAnyNote } from "../NoteRenderer/NoteRenderer";
import type { ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";

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

const CMAP_URL = "node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

pdfJs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

interface PdfViewerProps {
  pdfUrl: string;
}

export function PdfViewer({ pdfUrl }: PdfViewerProps) {
  const [rootElement, setRootElement] = useState<HTMLDivElement>();
  const [pdfJsViewerInstance, setPdfJsViewerInstance] = useState<pdfJsViewer.PDFViewer>();
  const { getSourceLocationByCoordinates } = useContext(CodeSyncContext) as ICodeSyncContext;

  const handleRootRef = useCallback((element: HTMLDivElement) => {
    setRootElement(element);
  }, []);

  useEffect(() => {
    async function loadPdf() {
      if (!rootElement) return;

      const eventBus = new pdfJsViewer.EventBus();

      // (Optionally) enable hyperlinks within PDF files.
      const pdfLinkService = new pdfJsViewer.PDFLinkService({
        eventBus,
      });

      // (Optionally) enable find controller.
      const pdfFindController = new pdfJsViewer.PDFFindController({
        eventBus,
        linkService: pdfLinkService,
      });

      const pdfViewer = new pdfJsViewer.PDFViewer({
        container: rootElement,
        eventBus,
        linkService: pdfLinkService,
        findController: pdfFindController,
        imageResourcesPath: "pdf-viewer-images/",
      });

      setPdfJsViewerInstance(pdfViewer);

      pdfLinkService.setViewer(pdfViewer);

      eventBus.on("pagesinit", () => {
        // We can use pdfViewer now, e.g. let's change default scale.
        pdfViewer.currentScaleValue = "1.2";
      });

      // Loading document.
      const loadingTask = pdfJs.getDocument({
        url: pdfUrl,
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
      });

      const pdfDocument = await loadingTask.promise;
      // Document loaded, specifying document for the viewer and
      // the (optional) linkService.
      pdfViewer.setDocument(pdfDocument);

      pdfLinkService.setDocument(pdfDocument, null);
    }

    if (pdfUrl && rootElement) {
      loadPdf();
    }
  }, [pdfUrl, rootElement]);

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

      const synctexFound = getSourceLocationByCoordinates(left, top, pageNumber);

      if (synctexFound) {
        console.log(synctexFound.fileId, synctexFound.line);
      }
    },
    [getSourceLocationByCoordinates]
  );

  return (
    <div ref={handleRootRef} className="pdf-viewer-root" onDoubleClick={handleDoubleClick}>
      <div className="pdfViewer" />
      {pdfJsViewerInstance && rootElement && (
        <NoteRenderer notes={MOCK_NOTES} pdfJsViewerInstance={pdfJsViewerInstance} viewerRoot={rootElement} />
      )}
    </div>
  );
}
