import { useContext, useMemo } from "react";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";
import { type IPdfContext, PdfContext } from "../../PdfProvider/PdfProvider";
import { HighlightNote } from "./components/HighlightNote/HighlightNote";

export function NoteRenderer() {
  const { notes, notesPinned } = useContext(NotesContext) as INotesContext;
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const { visiblePages, pageOffsets } = useContext(PdfContext) as IPdfContext;

  // group notes pointing to the same selection together
  const bySelection = useMemo(() => {
    const bySelection = new Map<string, IDecoratedNote[]>();
    for (const note of notes) {
      const { selectionStart, selectionEnd } = note.current;
      const id = [selectionStart.pageNumber, selectionStart.index, selectionEnd.pageNumber, selectionEnd.index].join(
        ",",
      );
      let notes = bySelection.get(id);
      if (!notes) {
        notes = [];
        bySelection.set(id, notes);
      }
      notes.push(note);
    }
    return Array.from(bySelection.entries());
  }, [notes]);

  return bySelection.map(([id, notes]) => {
    if (!viewer) return;

    const pageNumber = notes[0].current.selectionStart.pageNumber;
    const isInViewport = visiblePages.includes(pageNumber);
    // NOTE: we control visibility internally, to maintain the state of the component
    // (i.e. visibility of the note).
    return (
      <HighlightNote
        notes={notes}
        isPinnedByDefault={notesPinned}
        isInViewport={isInViewport}
        pageOffset={pageOffsets.current[pageNumber]}
        key={id}
      />
    );
  });
}
