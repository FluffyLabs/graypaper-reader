import { useContext, useMemo } from "react";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { HighlightNote } from "./components/HighlightNote/HighlightNote";
import { PointNote } from "./components/PointNote/PointNote";

export function NoteRenderer() {
  const { notes } = useContext(NotesContext) as INotesContext;
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const { visiblePages, pageOffsets } = useContext(PdfContext) as IPdfContext;

  const notesToRender = useMemo(
    () => notes.filter((note) => visiblePages.includes(note.canMigrateTo?.pageNumber ?? note.pageNumber)),
    [notes, visiblePages],
  );

  return notesToRender.map((note) => {
    if (!viewer) return;

    const pageNumber = note.canMigrateTo?.pageNumber ?? note.pageNumber;

    if ("left" in note && "top" in note) {
      return <PointNote note={note} pageOffset={pageOffsets[pageNumber]} key={note.date} />;
    }

    if ("selectionStart" in note && "selectionEnd" in note && "selectionString" in note) {
      return <HighlightNote note={note} pageOffset={pageOffsets[pageNumber]} key={note.date} />;
    }

    throw new Error("Unidentified note type.");
  });
}
