import { memo, useCallback, useContext, useRef } from "react";
import "./NoteManager.css";
import type { ISynctexBlockId } from "@fluffylabs/links-metadata";
import { twMerge } from "tailwind-merge";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { LABEL_LOCAL } from "../NotesProvider/consts/labels";
import type { IDecoratedNote } from "../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../NotesProvider/types/StorageNote";
import { areSelectionsEqual } from "../NotesProvider/utils/areSelectionsEqual";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { InactiveNoteSkeleton } from "./components/InactiveNoteSkeleton";
import { NewNote } from "./components/NewNote";
import { NotesList } from "./components/NotesList";

const DEFAULT_AUTHOR = "";

export function NoteManager({ className }: { className?: string }) {
  return (
    <div className={twMerge("notes-wrapper gap-4", className)}>
      <Notes />
    </div>
  );
}

const MemoizedNotesList = memo(NotesList);

function Notes() {
  const { locationParams, setLocationParams } = useContext(LocationContext) as ILocationContext;
  const { notesReady, activeNotes, notes, handleAddNote, handleDeleteNote, handleUpdateNote } = useContext(
    NotesContext,
  ) as INotesContext;
  const { selectedBlocks, pageNumber, handleClearSelection } = useContext(SelectionContext) as ISelectionContext;
  const keepShowingNewNote = useRef<{ selectionEnd: ISynctexBlockId; selectionStart: ISynctexBlockId }>(undefined);

  const handleAddNoteRef = useRef(handleAddNote);
  handleAddNoteRef.current = handleAddNote;
  const handleDeleteNoteRef = useRef(handleDeleteNote);
  handleDeleteNoteRef.current = handleDeleteNote;
  const handleUpdateNoteRef = useRef(handleUpdateNote);
  handleUpdateNoteRef.current = handleUpdateNote;

  const memoizedHandleDeleteNote = useCallback(
    (note: IDecoratedNote) => {
      handleDeleteNoteRef.current(note);
      handleClearSelection();
    },
    [handleClearSelection],
  );

  const memoizedHandleUpdateNote = useCallback((note: IDecoratedNote, newNote: IStorageNote) => {
    handleUpdateNoteRef.current(note, newNote);
  }, []);

  const handleNewNoteCancel = useCallback(() => {
    handleClearSelection();
  }, [handleClearSelection]);

  const handleAddNoteClick = useCallback(
    ({ noteContent }: { noteContent: string }) => {
      if (
        selectedBlocks.length === 0 ||
        pageNumber === null ||
        !locationParams.selectionStart ||
        !locationParams.selectionEnd
      ) {
        throw new Error("Attempted saving a note without selection.");
      }

      const newNote: IStorageNote = {
        noteVersion: 3,
        content: noteContent,
        date: Date.now(),
        author: DEFAULT_AUTHOR,
        selectionStart: locationParams.selectionStart,
        selectionEnd: locationParams.selectionEnd,
        version: locationParams.version,
        labels: [LABEL_LOCAL],
      };

      handleAddNoteRef.current(newNote);
      keepShowingNewNote.current = {
        selectionStart: locationParams.selectionStart,
        selectionEnd: locationParams.selectionEnd,
      };
    },
    [pageNumber, selectedBlocks, locationParams],
  );

  const locationRef = useRef({ locationParams, setLocationParams });
  locationRef.current = { locationParams, setLocationParams };

  const memoizedHandleSelectNote = useCallback(
    (note: IDecoratedNote, { type = "currentVersion" }: { type: "currentVersion" | "originalVersion" | "close" }) => {
      let selectionStart: ISynctexBlockId | undefined = note.current.selectionStart;
      let selectionEnd: ISynctexBlockId | undefined = note.current.selectionEnd;
      let version: string | undefined = locationRef.current.locationParams.version;

      if (type === "originalVersion") {
        selectionStart = note.original.selectionStart;
        selectionEnd = note.original.selectionEnd;
        version = note.original.version;
      }

      if (type === "close") {
        selectionStart = undefined;
        selectionEnd = undefined;
      }

      locationRef.current.setLocationParams({
        selectionStart,
        selectionEnd,
        version: version,
      });
    },
    [],
  );

  const isActiveNotes = notes.some((note) => activeNotes.includes(note));

  return (
    <div
      className="note-manager flex flex-col gap-2.5"
      style={{ opacity: notesReady ? 1.0 : 0.3, pointerEvents: notesReady ? "auto" : "none" }}
    >
      {locationParams.selectionEnd &&
        locationParams.selectionStart &&
        !isActiveNotes &&
        (notesReady || areSelectionsEqual(locationParams, keepShowingNewNote.current)) && (
          <NewNote
            selectionStart={locationParams.selectionStart}
            selectionEnd={locationParams.selectionEnd}
            version={locationParams.version}
            onCancel={handleNewNoteCancel}
            onSave={handleAddNoteClick}
          />
        )}

      {!notesReady && notes.length === 0 && (
        <>
          <InactiveNoteSkeleton />
          <InactiveNoteSkeleton />
          <InactiveNoteSkeleton />
          <InactiveNoteSkeleton />
        </>
      )}

      {notesReady && notes.length === 0 && <div className="no-notes text-sidebar-foreground">No notes available</div>}

      {notes.length > 0 && (
        <MemoizedNotesList
          activeNotes={activeNotes}
          notes={notes}
          onEditNote={memoizedHandleUpdateNote}
          onDeleteNote={memoizedHandleDeleteNote}
          onSelectNote={memoizedHandleSelectNote}
        />
      )}
    </div>
  );
}
