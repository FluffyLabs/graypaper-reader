import "pdfjs-dist/web/pdf_viewer.css";
import "./PdfViewer.css";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { type WheelEventHandler, useCallback, useContext, useEffect, useState } from "react";
import { PdfContext, themesOrder } from "../PdfProvider/PdfProvider";
import type { IPdfContext } from "../PdfProvider/PdfProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { NoteRenderer } from "./NoteRenderer/NoteRenderer";
import { SelectionRenderer } from "./SelectionRenderer/SelectionRenderer";

const IMAGE_RESOURCES_PATH = "pdf-viewer-images/";
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 2.0;
const WHEEL_SCALE_MULTIPLIER = 0.001;
const INITIAL_SCALE = "0.85";

export function PdfViewer() {
  const [rootElement, setRootElement] = useState<HTMLDivElement>();
  const [pagesLoaded, setPagesLoaded] = useState<boolean>(false);
  const { eventBus, linkService, findController, pdfDocument, setViewer, viewer, theme } = useContext(
    PdfContext,
  ) as IPdfContext;
  const { handleViewerMouseUp } = useContext(SelectionContext) as ISelectionContext;

  const handleWheel: WheelEventHandler = (e) => {
    if (!viewer) return;

    if (e.ctrlKey || e.metaKey) {
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, viewer.currentScale - e.deltaY * WHEEL_SCALE_MULTIPLIER),
      );
      viewer.currentScaleValue = newScale.toString();
    }
  };

  const handleRootRef = useCallback((element: HTMLDivElement) => {
    setRootElement(element);
  }, []);

  // prevent browser's mousewheel zoom
  useEffect(() => {
    if (!rootElement) return;

    const handleWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    rootElement.addEventListener("wheel", handleWheelZoom, { passive: false });

    return () => {
      rootElement.removeEventListener("wheel", handleWheelZoom);
    };
  });

  useEffect(() => {
    async function loadViewer() {
      if (!rootElement || !pdfDocument || !eventBus || !linkService) return;

      rootElement.innerHTML = "";
      const viewerContainer = document.createElement("div");
      viewerContainer.classList.add("pdfViewer");
      rootElement.appendChild(viewerContainer);

      const pdfViewer = new pdfJsViewer.PDFViewer({
        container: rootElement,
        viewer: viewerContainer,
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
        pdfViewer.currentScaleValue = INITIAL_SCALE;
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

  useEffect(() => {
    if (!rootElement || !viewer) return;

    rootElement.querySelector(".pdfViewer")?.classList.remove(...themesOrder);
    rootElement.querySelector(".pdfViewer")?.classList.add(theme);
  }, [theme, rootElement, viewer]);

  const removeSelection = useCallback(() => {
    window.getSelection()?.empty();
  }, []);

  if (!pdfDocument) return <div className="pdf-viewer-loading">Loading...</div>;

  return (
    <>
      <div
        ref={handleRootRef}
        className="pdf-viewer-root"
        onMouseDown={removeSelection}
        onMouseUp={handleViewerMouseUp}
        onWheel={handleWheel}
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
