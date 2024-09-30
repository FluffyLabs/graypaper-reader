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
  const { notes } = useContext(NotesContext) as INotesContext;
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const [pageOffsets, setPageOffsets] = useState<DOMRect[]>([]);

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
  }, SCROLL_THROTTLE_DELAY_MS);

  useEffect(() => {
    if (!viewer?.container) return;

    const handler = handleViewChanged;

    viewer.container.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);

    return () => {
      viewer.container.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [viewer, handleViewChanged]);

  useEffect(() => {
    if (!viewer) return;
    viewer.container.dispatchEvent(new CustomEvent("scroll"));
  }, [viewer]);

  const notesToRender = useMemo(
    () => notes.filter((note) => visiblePages.includes(note.pageNumber)),
    [notes, visiblePages],
  );

  return notesToRender.map((note) => {
    if (!viewer) return;

    if ("left" in note && "top" in note) {
      return <PointNote note={note} pageOffset={pageOffsets[note.pageNumber]} key={note.date} />;
    }

    if ("selectionStart" in note && "selectionEnd" in note && "selectionString" in note) {
      return <HighlightNote note={note} pageOffset={pageOffsets[note.pageNumber]} key={note.date} />;
    }

    throw new Error("Unidentified note type.");
  });
}
