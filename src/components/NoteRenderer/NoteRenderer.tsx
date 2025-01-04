import { useContext } from "react";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { HighlightNote } from "./components/HighlightNote/HighlightNote";

export function NoteRenderer() {
  const { notes } = useContext(NotesContext) as INotesContext;
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const { visiblePages, pageOffsets } = useContext(PdfContext) as IPdfContext;

  return notes.map((note) => {
    if (!viewer) return;

    const pageNumber = note.current.selectionStart.pageNumber;
    const isVisible = visiblePages.includes(note.current.selectionStart.pageNumber);
    return (
      <HighlightNote note={note} isVisible={isVisible} pageOffset={pageOffsets.current[pageNumber]} key={note.key} />
    );
  });
}
