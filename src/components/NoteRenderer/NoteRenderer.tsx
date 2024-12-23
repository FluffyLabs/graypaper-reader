import { useContext, useMemo } from "react";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { HighlightNote } from "./components/HighlightNote/HighlightNote";

export function NoteRenderer() {
  const { notes } = useContext(NotesContext) as INotesContext;
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const { visiblePages, pageOffsets } = useContext(PdfContext) as IPdfContext;

  const notesToRender = useMemo(
    () => notes.filter((note) => visiblePages.includes(note.selectionStart.pageNumber)),
    [notes, visiblePages],
  );

  return notesToRender.map((note) => {
    if (!viewer) return;

    const pageNumber = note.selectionStart.pageNumber;
    return <HighlightNote note={note} pageOffset={pageOffsets[pageNumber]} key={note.hash} />;
  });
}
