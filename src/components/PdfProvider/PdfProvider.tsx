import * as pdfJs from "pdfjs-dist";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { createContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

const CMAP_URL = "node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

export const PdfContext = createContext<IPdfContext | null>(null);

pdfJs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

export interface IPdfServices {
  eventBus?: pdfJsViewer.EventBus;
  linkService?: pdfJsViewer.PDFLinkService;
  findController?: pdfJsViewer.PDFFindController;
  pdfDocument?: pdfJs.PDFDocumentProxy;
}

export interface IPdfContext extends IPdfServices {
  viewer: pdfJsViewer.PDFViewer | undefined;
  setViewer: Dispatch<SetStateAction<pdfJsViewer.PDFViewer | undefined>>;
  scale: number;
}

interface IPdfProviderProps {
  pdfUrl: string;
  children: ReactNode;
}

export function PdfProvider({ pdfUrl, children }: IPdfProviderProps) {
  const [services, setServices] = useState<IPdfServices>({});
  const [viewer, setViewer] = useState<pdfJsViewer.PDFViewer>();
  const [scale, setScale] = useState<number>(0);

  useEffect(() => {
    async function setupPdfServices() {
      const eventBus = new pdfJsViewer.EventBus();

      const linkService = new pdfJsViewer.PDFLinkService({
        eventBus,
      });

      const findController = new pdfJsViewer.PDFFindController({
        eventBus,
        linkService,
      });

      const pdfDocument = await pdfJs.getDocument({
        url: pdfUrl,
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
      }).promise;

      linkService.setDocument(pdfDocument, null);

      setServices({
        eventBus,
        linkService,
        findController,
        pdfDocument,
      });
    }

    if (pdfUrl) {
      setServices({});
      setViewer(undefined);
      setupPdfServices();
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (!services.eventBus || !viewer) return;

    const eventBus = services.eventBus;

    const handleScaleChanging = () => {
      setScale(viewer.currentScale);
    };

    eventBus.on("scalechanging", handleScaleChanging);

    return () => {
      eventBus.off("scalechanging", handleScaleChanging);
    };
  }, [services.eventBus, viewer]);

  useEffect(() => {
    if (viewer) {
      setScale(viewer.currentScale);
    }
  }, [viewer]);

  const context = {
    ...services,
    viewer,
    setViewer,
    scale,
  };

  return <PdfContext.Provider value={context}>{children}</PdfContext.Provider>;
}
