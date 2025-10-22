import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../../NotesProvider/types/StorageNote";
import { Note } from "./Note";

export const NotesList = ({
  notes,
  activeNotes,
  onEditNote,
  onDeleteNote,
}: {
  notes: IDecoratedNote[];
  activeNotes: IDecoratedNote[];
  onEditNote: (noteToReplace: IDecoratedNote, newNote: IStorageNote) => void;
  onDeleteNote: (noteToDelete: IDecoratedNote) => void;
}) => {
  if (notes.length === 0) {
    return <div className="no-notes text-sidebar-foreground">No notes available.</div>;
  }

  return (
    <>
      {notes.map((note) => (
        <Note
          key={note.key}
          active={activeNotes.includes(note)}
          note={note}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
        />
      ))}
    </>
  );
};
