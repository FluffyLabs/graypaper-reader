import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useThrottle } from "../../hooks/useThrottle";
import { subtractBorder } from "../../utils/subtractBorder";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { HighlightNote } from "./components/HighlightNote/HighlightNote";
import { PointNote } from "./components/PointNote/PointNote";

const SCROLL_THROTTLE_DELAY_MS = 100;

function isPartlyInViewport({ top, bottom }: DOMRect) {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  return (
    (top <= 0 && bottom > 0) ||
    (top < viewportHeight && bottom >= viewportHeight) ||
    (top > 0 && bottom < viewportHeight)
  );
}

export function NoteRenderer() {
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const viewerRootEventHandlerRef = useRef<() => void>();
  const { eventBus } = useContext(PdfContext) as IPdfContext;
  const { notes } = useContext(NotesContext) as INotesContext;
  const { viewer } = useContext(PdfContext) as IPdfContext;

  const handleViewChanged = useThrottle(() => {
    if (!viewer) return;

    const visiblePagesAfterEvent: number[] = [];

    for (let i = 0; i < viewer.pagesCount; i++) {
      if (isPartlyInViewport(viewer.getPageView(i).div.getBoundingClientRect())) {
        visiblePagesAfterEvent.push(i + 1); // using page numbers instead of indices
      }
    }

    setVisiblePages((visiblePages) =>
      visiblePages.join(";") !== visiblePagesAfterEvent.join(";") ? visiblePagesAfterEvent : visiblePages,
    );
  }, SCROLL_THROTTLE_DELAY_MS);

  useEffect(() => {
    if (!viewer) return;

    if (viewer.container) {
      if (viewerRootEventHandlerRef.current) {
        viewer.container.removeEventListener("scroll", viewerRootEventHandlerRef.current);
      }

      viewer.container.addEventListener("scroll", handleViewChanged);
      viewerRootEventHandlerRef.current = handleViewChanged;
    }

    return () => {
      if (viewerRootEventHandlerRef.current) {
        viewer.container.removeEventListener("scroll", viewerRootEventHandlerRef.current);
      }
    };
  }, [viewer, handleViewChanged]);

  useEffect(() => {
    if (!viewer) return;

    eventBus.on("pagesloaded", () => {
      viewer.container.dispatchEvent(new CustomEvent("scroll"));
    });
  }, [viewer, eventBus]);

  const notesToRender = useMemo(
    () => notes.filter((note) => visiblePages.includes(note.pageNumber)),
    [notes, visiblePages],
  );

  return notesToRender.map((note) => {
    if (!viewer) return;

    const pageElement = viewer.getPageView(note.pageNumber - 1)?.div;

    if (!pageElement) return null;

    const pageOffset = subtractBorder(
      new DOMRect(pageElement.offsetLeft, pageElement.offsetTop, pageElement.offsetWidth, pageElement.offsetHeight),
      pageElement,
    );

    if ("left" in note && "top" in note) {
      return <PointNote note={note} pageOffset={pageOffset} key={note.date} />;
    }

    if ("blocks" in note) {
      if (!note.blocks.length) return null;

      return <HighlightNote note={note} pageOffset={pageOffset} key={note.date} />;
    }

    throw new Error("Unidentified note type.");
  });
}
