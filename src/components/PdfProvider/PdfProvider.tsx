import { jsPDF } from "jspdf";
import * as pdfJs from "pdfjs-dist";
import * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, ReactNode, SetStateAction } from "react";
import { subtractBorder } from "../../utils/subtractBorder";

const CMAP_URL = "node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

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
  pageOffsets: MutableRefObject<DOMRect[]>;
  downloadPdfWithTheme: () => void;
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

async function renderPageWithTheme(page: pdfJs.PDFPageProxy, theme: ITheme, scale: number = 2): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (context) {
    context.fillStyle = theme === "dark" ? "#000000" : theme === "gray" ? "#808080" : "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    if (theme === "gray") {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]; // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
      }

      context.putImageData(imageData, 0, 0);
    } else if (theme === "light") {
      // to be fixed
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(255 - data[i] * 1.5, 0); // Red
        data[i + 1] = Math.max(255 - data[i + 1] * 1.5, 0); // Green
        data[i + 2] = Math.max(255 - data[i + 2] * 1.5, 0); // Blue
      }

      context.putImageData(imageData, 0, 0);
    }
  }
  return canvas;
}

async function createPdfWithTheme(pdfDocument: pdfJs.PDFDocumentProxy, theme: ITheme, scale: number = 2): Promise<jsPDF> {
  const doc = new jsPDF();

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const canvas = await renderPageWithTheme(page, theme, scale);

    if (i > 1) {
      doc.addPage();
    }

    doc.addImage(canvas.toDataURL("image/jpeg"), "JPEG", 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
  }

  return doc;
}

export function PdfProvider({ pdfUrl, children }: IPdfProviderProps) {
  const [services, setServices] = useState<IPdfServices>({});
  const [viewer, setViewer] = useState<pdfJsViewer.PDFViewer>();
  const [scale, setScale] = useState<number>(0);
  const [theme, setTheme] = useState<ITheme>(loadThemeSettingFromLocalStorage());
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const pageOffsets = useRef([]);

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
      pageOffsets.current = [];
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

  usePageOffsets({
    viewer,
    services,
    pageOffsets,
    setVisiblePages,
  });

  const downloadPdfWithTheme = useCallback(async () => {
    if (services.pdfDocument) {
      const doc = await createPdfWithTheme(services.pdfDocument, theme, 5);
      doc.save(`graypaper-${theme}-theme.pdf`);
    }
  }, [services.pdfDocument, theme]);

  const context = useMemo(
    () => ({
      ...services,
      viewer,
      setViewer,
      scale,
      theme,
      setTheme,
      visiblePages,
      pageOffsets,
      downloadPdfWithTheme,
    }),
    [theme, viewer, visiblePages, services, scale, downloadPdfWithTheme],
  );

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

function usePageOffsets({
  viewer,
  services,
  setVisiblePages,
  pageOffsets,
}: {
  viewer?: pdfJsViewer.PDFViewer;
  services: IPdfServices;
  setVisiblePages: Dispatch<SetStateAction<number[]>>;
  pageOffsets: MutableRefObject<DOMRect[]>;
}) {
  const handleViewChanged = useCallback(
    (forceUpdate: boolean) => {
      // TODO [ToDr] throttle?
      if (!viewer) return;

      const visiblePagesAfterEvent: number[] = [];

      for (let i = 0; i < viewer.pagesCount; i++) {
        if (isPartlyInViewport(viewer.getPageView(i).div.getBoundingClientRect())) {
          visiblePagesAfterEvent.push(i + 1); // using page numbers instead of indices
        }
      }

      setVisiblePages((visiblePages) => {
        if (forceUpdate || visiblePages.join(";") !== visiblePagesAfterEvent.join(";")) {
          return visiblePagesAfterEvent;
        }
        return visiblePages;
      });

      for (let page = 1; page <= viewer.pagesCount; page++) {
        const pageElement = viewer.getPageView(page - 1)?.div;

        pageOffsets.current[page] = subtractBorder(
          new DOMRect(pageElement.offsetLeft, pageElement.offsetTop, pageElement.offsetWidth, pageElement.offsetHeight),
          pageElement,
        );
      }
    },
    [viewer, setVisiblePages, pageOffsets],
  );

  // update page offsets on scroll or resize
  useEffect(() => {
    if (!viewer?.container) return;

    // in case of scroll we don't want to force the update.
    // the page offsets do not really changed.
    const handler = () => handleViewChanged(false);
    const resizeObserver = new ResizeObserver(handler);

    viewer.container.addEventListener("scroll", handler);
    resizeObserver.observe(viewer.container);

    return () => {
      viewer.container.removeEventListener("scroll", handler);
      resizeObserver.disconnect();
    };
  }, [viewer, handleViewChanged]);

  // update page offsets when scale is changing
  useEffect(() => {
    if (!services.eventBus || !viewer) return;

    const { eventBus } = services;
    // in case the scale is changed, we want to force
    // new page offsets to be calculated and components
    // depending on that re-rendered.
    // This happens through `visiblePages` changing, otherwise
    // since `pageOffsets` are a ref, we won't see any
    // components noticing the change in page offsets, hence
    // no rendering would occur.
    const handler = () => handleViewChanged(true);
    eventBus.on("scalechanging", handler);

    return () => {
      eventBus.off("scalechanging", handler);
    };
  }, [services, viewer, handleViewChanged]);
}
