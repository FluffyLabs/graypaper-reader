import * as pdfJs from "pdfjs-dist";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { createContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useThrottle } from "../../hooks/useThrottle";
import { subtractBorder } from "../../utils/subtractBorder";

const CMAP_URL = "node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const DIMENSION_ADJUSTMENT_THROTTLE_MS = 100;

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
  lightThemeEnabled: boolean;
  setLightThemeEnabled: Dispatch<SetStateAction<boolean>>;
  visiblePages: number[];
  pageOffsets: DOMRect[];
}

interface IPdfProviderProps {
  pdfUrl: string;
  children: ReactNode;
}

const THEME_LOCAL_STORAGE_KEY = "light-theme-enabled";

function loadThemeSettingFromLocalStorage() {
  const localStorageValue = window.localStorage.getItem(THEME_LOCAL_STORAGE_KEY) ?? "false";

  return localStorageValue.toLowerCase() === "true";
}

function saveThemeSettingToLocalStorage(value: boolean) {
  try {
    window.localStorage.setItem(THEME_LOCAL_STORAGE_KEY, value.toString());
  } catch (e) {
    console.error(`Unable to save theme setting: ${e}`);
  }
}

function isPartlyInViewport({ top, bottom }: DOMRect) {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  return (
    (top <= 0 && bottom > 0) ||
    (top < viewportHeight && bottom >= viewportHeight) ||
    (top > 0 && bottom < viewportHeight)
  );
}

export function PdfProvider({ pdfUrl, children }: IPdfProviderProps) {
  const [services, setServices] = useState<IPdfServices>({});
  const [viewer, setViewer] = useState<pdfJsViewer.PDFViewer>();
  const [scale, setScale] = useState<number>(0);
  const [lightThemeEnabled, setLightThemeEnabled] = useState<boolean>(loadThemeSettingFromLocalStorage());
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const [pageOffsets, setPageOffsets] = useState<DOMRect[]>([]);

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

    const { eventBus } = services;

    const handleScaleChanging = () => {
      setScale(viewer.currentScale);
    };

    eventBus.on("scalechanging", handleScaleChanging);

    return () => {
      eventBus.off("scalechanging", handleScaleChanging);
    };
  }, [services, viewer]);

  useEffect(() => {
    if (viewer) {
      setScale(viewer.currentScale);
    }
  }, [viewer]);

  useEffect(() => {
    saveThemeSettingToLocalStorage(lightThemeEnabled);
  }, [lightThemeEnabled]);

  const handleViewChanged = useThrottle(() => {
    if (!viewer) return;

    const visiblePagesAfterEvent: number[] = [];

    for (let i = 0; i < viewer.pagesCount; i++) {
      if (isPartlyInViewport(viewer.getPageView(i).div.getBoundingClientRect())) {
        visiblePagesAfterEvent.push(i + 1); // using page numbers instead of indices
      }
    }

    if (visiblePages.join(";") !== visiblePagesAfterEvent.join(";")) {
      setVisiblePages(visiblePagesAfterEvent);
    }

    const newPageOffsets: DOMRect[] = [];

    for (const page of visiblePagesAfterEvent) {
      const pageElement = viewer.getPageView(page - 1)?.div;

      newPageOffsets[page] = subtractBorder(
        new DOMRect(pageElement.offsetLeft, pageElement.offsetTop, pageElement.offsetWidth, pageElement.offsetHeight),
        pageElement,
      );
    }

    setPageOffsets(newPageOffsets);
  }, DIMENSION_ADJUSTMENT_THROTTLE_MS);

  useEffect(() => {
    if (!viewer?.container) return;

    const handler = handleViewChanged;
    const resizeObserver = new ResizeObserver(handler);

    viewer.container.addEventListener("scroll", handler);
    resizeObserver.observe(viewer.container);

    return () => {
      viewer.container.removeEventListener("scroll", handler);
      resizeObserver.disconnect();
    };
  }, [viewer, handleViewChanged]);

  useEffect(() => {
    if (!viewer) return;
    viewer.container.dispatchEvent(new CustomEvent("scroll"));
  }, [viewer]);

  const context = {
    ...services,
    viewer,
    setViewer,
    scale,
    lightThemeEnabled,
    setLightThemeEnabled,
    visiblePages,
    pageOffsets,
  };

  return <PdfContext.Provider value={context}>{children}</PdfContext.Provider>;
}
