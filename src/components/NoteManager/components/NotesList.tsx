import { memo, useEffect, useRef } from "react";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../../NotesProvider/types/StorageNote";
import type { INotesMangerNote } from "../useNoteManagerNotes";
import { Note } from "./Note";

const MemoizedNote = memo(Note);

export const NotesList = ({
  notes,
  activeNotes,
  onEditNote,
  onDeleteNote,
  onSelectNote,
}: {
  notes: INotesMangerNote[];
  activeNotes: Set<IDecoratedNote>;
  onEditNote: (noteToReplace: IDecoratedNote, newNote: IStorageNote) => void;
  onDeleteNote: (noteToDelete: IDecoratedNote) => void;
  onSelectNote: (note: IDecoratedNote, opts: { type: "currentVersion" | "originalVersion" | "close" }) => void;
}) => {
  const noteToScrollToRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeNotes.size > 0 && noteToScrollToRef.current && !isMostlyVisible(noteToScrollToRef.current)) {
      noteToScrollToRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeNotes]);

  return (
    <>
      {notes.map((note) => {
        const active = activeNotes.has(note.noteObject);
        const isFirstActive = active && activeNotes.values().next().value === note.noteObject;

        return (
          <MemoizedNote
            ref={isFirstActive ? noteToScrollToRef : undefined}
            key={note.noteObject.key}
            active={active}
            note={note.noteObject}
            sectionTitles={note.metadata}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
            onSelectNote={onSelectNote}
          />
        );
      })}
    </>
  );
};

const isMostlyVisible = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
  return visibleHeight >= rect.height * 0.6;
};
