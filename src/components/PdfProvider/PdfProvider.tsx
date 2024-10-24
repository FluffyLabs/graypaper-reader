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

export type ITheme = "light" | "gray" | "dark";
export const themesOrder: ITheme[] = ["dark", "gray", "light"];

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
  theme: ITheme;
  setTheme: Dispatch<SetStateAction<ITheme>>;
  visiblePages: number[];
  pageOffsets: DOMRect[];
}

interface IPdfProviderProps {
  pdfUrl: string;
  children: ReactNode;
}

const THEME_LOCAL_STORAGE_KEY = "theme";

function loadThemeSettingFromLocalStorage(): ITheme {
  const localStorageValue = window.localStorage.getItem(THEME_LOCAL_STORAGE_KEY) ?? "false";

  switch (localStorageValue.toLowerCase()) {
    case "light":
      return "light";
    case "gray":
      return "gray";
    case "dark":
      return "dark";
    default:
      return "dark";
  }
}

function saveThemeSettingToLocalStorage(value: ITheme) {
  try {
    window.localStorage.setItem(THEME_LOCAL_STORAGE_KEY, value);
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
  const [theme, setTheme] = useState<ITheme>(loadThemeSettingFromLocalStorage());
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const [pageOffsets, setPageOffsets] = useState<DOMRect[]>([]);

  // Initial setup
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

  useScaleUpdater({
    setScale,
    services,
    viewer,
  });

  useEffect(() => {
    saveThemeSettingToLocalStorage(theme);
  }, [theme]);

  useScrolling({
    setPageOffsets,
    setVisiblePages,
    viewer,
    visiblePages,
  });

  const context = {
    ...services,
    viewer,
    setViewer,
    scale,
    theme,
    setTheme,
    visiblePages,
    pageOffsets,
  };

  return <PdfContext.Provider value={context}>{children}</PdfContext.Provider>;
}

function useScaleUpdater({
  setScale,
  services,
  viewer,
}: {
  setScale(s: number): void;
  viewer?: pdfJsViewer.PDFViewer;
  services: IPdfServices;
}) {
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
  }, [services, viewer, setScale]);

  useEffect(() => {
    if (viewer) {
      setScale(viewer.currentScale);
    }
  }, [viewer, setScale]);
}

function useScrolling({
  viewer,
  setVisiblePages,
  visiblePages,
  setPageOffsets,
}: {
  viewer?: pdfJsViewer.PDFViewer;
  setVisiblePages: (s: number[]) => void;
  visiblePages: number[];
  setPageOffsets: (o: DOMRect[]) => void;
}) {
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

    for (let page = 1; page <= viewer.pagesCount; page++) {
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
}
