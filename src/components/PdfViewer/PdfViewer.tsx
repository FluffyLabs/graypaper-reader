import "pdfjs-dist/web/pdf_viewer.css";
import "./PdfViewer.css";
import { useCallback, useEffect, useState } from "react";
import * as pdfJs from "pdfjs-dist";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";

import synctexJson from "../../../public/graypaper.synctex.json";

const CMAP_URL = "node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

pdfJs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
interface PdfViewerProps {
  url: string;
}

interface TextLayerReneredEventPayload {
  source: pdfJsViewer.PDFPageView;
  pageNumber: number;
  error: Error;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [rootElement, setRootElement] = useState<HTMLDivElement>();
  const [pdfJsViewerInstance, setPdfJsViewerInstance] = useState<pdfJsViewer.PDFViewer>();

  const handleRootRef = useCallback((element: HTMLDivElement) => {
    setRootElement(element);
  }, []);

  useEffect(() => {
    async function loadPdf() {
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
      });

      setPdfJsViewerInstance(pdfViewer);

      pdfLinkService.setViewer(pdfViewer);

      eventBus.on("pagesinit", () => {
        // We can use pdfViewer now, e.g. let's change default scale.
        pdfViewer.currentScaleValue = "1.2";
      });

      // Loading document.
      const loadingTask = pdfJs.getDocument({
        url,
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
      });

      const pdfDocument = await loadingTask.promise;
      // Document loaded, specifying document for the viewer and
      // the (optional) linkService.
      pdfViewer.setDocument(pdfDocument);

      pdfLinkService.setDocument(pdfDocument, null);
    }

    if (url && rootElement) {
      loadPdf();
    }
  }, [url, rootElement]);

  useEffect(() => {
    if (pdfJsViewerInstance) {
      const handleTextLayerRendered = (textLayer: TextLayerReneredEventPayload) => {
        // handle both versions for backwards-compatibility
        const textLayerDiv = textLayer.source.textLayer?.div;

        if (textLayerDiv && textLayerDiv.dataset.listeningForDoubleClick !== "true") {
          textLayerDiv.dataset.listeningForDoubleClick = "true";

          const doubleClickListener = (event: MouseEvent) => {
            const pageCanvas = textLayerDiv.closest(".page")?.querySelector("canvas");
            const pageBoundingRect = pageCanvas.getBoundingClientRect();

            if (pageBoundingRect) {
              const pageX = event.clientX - pageBoundingRect.left;
              const pageY = event.clientY - pageBoundingRect.top;

              const mmToInch = 0.0393701;
              const ppi = 72.27;
              const ptToTexUnit = 65536;
              const documentWidthMm = 210;
              const documentHeightMm = 297;

              const documentWidthInch = mmToInch * documentWidthMm;
              const documentHeightInch = mmToInch * documentHeightMm;

              const documentWidthTexUnit = documentWidthInch * ppi * ptToTexUnit;
              const documentHeightTexUnit = documentHeightInch * ppi * ptToTexUnit;

              const pageXTexUnit = (pageX / pageBoundingRect.width) * documentWidthTexUnit;
              const pageYTexUnit = (pageY / pageBoundingRect.height) * documentHeightTexUnit;

              const blocksInCurrPage = synctexJson.pages[textLayer.pageNumber];

              let lastMatch;

              for (let i = 0; i < blocksInCurrPage.length; i++) {
                const currBlock = blocksInCurrPage[i];
                if (
                  pageXTexUnit >= currBlock.left &&
                  pageXTexUnit <= currBlock.left + currBlock.width &&
                  pageYTexUnit >= currBlock.top - currBlock.height &&
                  pageYTexUnit <= currBlock.top
                ) {
                  lastMatch = currBlock;
                }
              }

              if (lastMatch) {
                console.log(synctexJson.files[lastMatch.file], lastMatch.line);
                Object.assign(document.getElementById("js-debug").style, {
                  display: "block",
                  left: `${(lastMatch.left / documentWidthTexUnit) * pageBoundingRect.width + pageBoundingRect.left}px`,
                  top: `${
                    ((lastMatch.top - lastMatch.height) / documentHeightTexUnit) * pageBoundingRect.height +
                    pageBoundingRect.top
                  }px`,
                  width: `${(lastMatch.width / documentWidthTexUnit) * pageBoundingRect.width}px`,
                  height: `${(lastMatch.height / documentHeightTexUnit) * pageBoundingRect.height}px`,
                });
                setTimeout(() => (document.getElementById("js-debug").style.display = "none"), 5000);
              }
            }
          };

          textLayerDiv.addEventListener("dblclick", doubleClickListener);
        }
      };

      pdfJsViewerInstance.eventBus.on("textlayerrendered", handleTextLayerRendered);
    }
  }, [pdfJsViewerInstance]);

  return (
    <div ref={handleRootRef} className="pdf-viewer-root">
      <div className="pdfViewer" />
    </div>
  );
}
