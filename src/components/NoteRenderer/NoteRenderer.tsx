import type { PDFViewer } from "pdfjs-dist/web/pdf_viewer.mjs";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useThrottle } from "../../hooks/useThrottle";
import { CodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import type { ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { HighlightNote } from "./components/HighlightNote/HighlightNote";
import { PointNote } from "./components/PointNote/PointNote";

const SCROLL_THROTTLE_DELAY_MS = 100;

export interface INote {
  content: string;
  date: number;
  author: string;
  pageNumber: number;
}

export interface IPointNote extends INote {
  left: number;
  top: number;
}

export interface IHighlightNote extends INote {
  line: number;
  fileId: number;
}

export type TAnyNote = IPointNote | IHighlightNote;

export interface IPageOffset {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface INoteRendererProps {
  notes: TAnyNote[];
  pdfJsViewerInstance: PDFViewer;
  viewerRoot: HTMLDivElement;
}

function isPartlyInViewport({ top, bottom }: DOMRect) {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  return (
    (top <= 0 && bottom > 0) ||
    (top < viewportHeight && bottom >= viewportHeight) ||
    (top > 0 && bottom < viewportHeight)
  );
}

export function NoteRenderer({ notes, pdfJsViewerInstance, viewerRoot }: INoteRendererProps) {
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const viewerRootEventHandlerRef = useRef<() => void>();
  const { getCoordinatesBySourceLocation } = useContext(CodeSyncContext) as ICodeSyncContext;
  const { eventBus } = useContext(PdfContext) as IPdfContext;

  const handleViewChanged = useThrottle(() => {
    const visiblePagesAfterEvent: number[] = [];

    for (let i = 0; i < pdfJsViewerInstance.pagesCount; i++) {
      if (isPartlyInViewport(pdfJsViewerInstance.getPageView(i).div.getBoundingClientRect())) {
        visiblePagesAfterEvent.push(i + 1); // using page numbers instead of indices
      }
    }

    setVisiblePages((visiblePages) =>
      visiblePages.join(";") !== visiblePagesAfterEvent.join(";") ? visiblePagesAfterEvent : visiblePages,
    );
  }, SCROLL_THROTTLE_DELAY_MS);

  useEffect(() => {
    if (viewerRoot) {
      if (viewerRootEventHandlerRef.current) {
        viewerRoot.removeEventListener("scroll", viewerRootEventHandlerRef.current);
      }

      viewerRoot.addEventListener("scroll", handleViewChanged);
      viewerRootEventHandlerRef.current = handleViewChanged;
    }

    return () => {
      if (viewerRootEventHandlerRef.current) {
        viewerRoot.removeEventListener("scroll", viewerRootEventHandlerRef.current);
      }
    };
  }, [viewerRoot, handleViewChanged]);

  useEffect(() => {
    eventBus.on("pagesloaded", () => {
      viewerRoot.dispatchEvent(new CustomEvent("scroll"));
    });
  }, [viewerRoot, eventBus]);

  const notesToRender = useMemo(
    () => notes.filter((note) => visiblePages.includes(note.pageNumber)),
    [notes, visiblePages],
  );

  return notesToRender.map((note) => {
    const pageElement = pdfJsViewerInstance.getPageView(note.pageNumber - 1)?.div;

    if (!pageElement) return null;

    const pageElementBorderWidth = Number.parseInt(getComputedStyle(pageElement).getPropertyValue("border-width"));
    const pageOffset: IPageOffset = {
      left: pageElement.offsetLeft + pageElementBorderWidth,
      top: pageElement.offsetTop + pageElementBorderWidth,
      width: pageElement.offsetWidth - 2 * pageElementBorderWidth,
      height: pageElement.offsetHeight - 2 * pageElementBorderWidth,
    };

    if ("left" in note && "top" in note) {
      return <PointNote note={note} pageOffset={pageOffset} key={note.date} />;
    }

    if ("line" in note && "fileId" in note) {
      const coordinates = getCoordinatesBySourceLocation(note.pageNumber, note.fileId, note.line);

      if (!coordinates.length) return null;

      return <HighlightNote note={note} pageOffset={pageOffset} coordinates={coordinates} key={note.date} />;
    }

    throw new Error("Unidentified note type.");
  });
}
