import { memo } from "react";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../../NotesProvider/types/StorageNote";
import { Note } from "./Note";

const MemoizedNote = memo(Note);

export const NotesList = ({
  notes,
  activeNotes,
  onEditNote,
  onDeleteNote,
  onSelectNote,
}: {
  notes: IDecoratedNote[];
  activeNotes: IDecoratedNote[];
  onEditNote: (noteToReplace: IDecoratedNote, newNote: IStorageNote) => void;
  onDeleteNote: (noteToDelete: IDecoratedNote) => void;
  onSelectNote: (note: IDecoratedNote, opts: { type: "currentVersion" | "originalVersion" | "close" }) => void;
}) => {
  return (
    <>
      {notes.map((note) => (
        <MemoizedNote
          key={note.key}
          active={activeNotes.includes(note)}
          note={note}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
          onSelectNote={onSelectNote}
        />
      ))}
    </>
  );
};
