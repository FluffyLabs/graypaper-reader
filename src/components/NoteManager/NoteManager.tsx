import { memo, useCallback, useContext, useEffect, useRef } from "react";
import "./NoteManager.css";
import type { ISynctexBlockId } from "@fluffylabs/links-metadata";
import { cn } from "@fluffylabs/shared-ui";
import { twMerge } from "tailwind-merge";
import { useLatestCallback } from "../../hooks/useLatestCallback";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import type { IDecoratedNote } from "../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../NotesProvider/types/StorageNote";
import { areSelectionsEqual } from "../NotesProvider/utils/areSelectionsEqual";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { InactiveNoteSkeleton } from "./components/InactiveNoteSkeleton";
import { NewNote } from "./components/NewNote";
import { NotesList } from "./components/NotesList";
import { useNoteManagerNotes } from "./useNoteManagerNotes";

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
  const {
    notesManagerNotes: notes,
    activeNotes,
    latestDeleteNote,
    latestHandleAddNote,
    latestUpdateNote,
    sectionTitlesLoaded,
    notesReady,
  } = useNoteManagerNotes();
  const { selectedBlocks, pageNumber, handleClearSelection } = useContext(SelectionContext) as ISelectionContext;
  const keepShowingNewNote = useRef<{ selectionEnd: ISynctexBlockId; selectionStart: ISynctexBlockId }>(undefined);
  const latestHandleClearSelection = useLatestCallback(handleClearSelection);

  const memoizedHandleDeleteNote = useCallback(
    (note: IDecoratedNote) => {
      latestDeleteNote.current(note);
      latestHandleClearSelection.current();
    },
    [latestHandleClearSelection, latestDeleteNote],
  );

  const memoizedHandleUpdateNote = useCallback(
    (note: IDecoratedNote, newNote: IStorageNote) => {
      note.original.content = newNote.content;
      latestUpdateNote.current(note, newNote);
    },
    [latestUpdateNote],
  );

  const handleNewNoteCancel = useCallback(() => {
    handleClearSelection();
  }, [handleClearSelection]);

  const handleAddNoteClick = useCallback(
    ({ noteContent, labels }: { noteContent: string; labels: string[] }) => {
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
        labels,
      };

      latestHandleAddNote.current(newNote);
      keepShowingNewNote.current = {
        selectionStart: locationParams.selectionStart,
        selectionEnd: locationParams.selectionEnd,
      };
    },
    [pageNumber, selectedBlocks, locationParams, latestHandleAddNote],
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

  const isActiveNotes = notes.some((note) => activeNotes.has(note.noteObject));

  const readyAndLoaded = notesReady && sectionTitlesLoaded;

  useEffect(() => {
    if (readyAndLoaded) {
      keepShowingNewNote.current = undefined;
    }
  }, [readyAndLoaded]);

  return (
    <div className={cn("note-manager flex flex-col gap-2.5", !readyAndLoaded && "opacity-30 pointer-events-none")}>
      {locationParams.selectionEnd &&
        locationParams.selectionStart &&
        pageNumber !== null &&
        selectedBlocks.length > 0 &&
        !isActiveNotes &&
        (readyAndLoaded || areSelectionsEqual(locationParams, keepShowingNewNote.current)) && (
          <NewNote
            selectionStart={locationParams.selectionStart}
            selectionEnd={locationParams.selectionEnd}
            version={locationParams.version}
            onCancel={handleNewNoteCancel}
            onSave={handleAddNoteClick}
          />
        )}

      {!readyAndLoaded && notes.length === 0 && (
        <>
          <InactiveNoteSkeleton />
          <InactiveNoteSkeleton />
          <InactiveNoteSkeleton />
          <InactiveNoteSkeleton />
        </>
      )}

      {readyAndLoaded && notes.length === 0 && (
        <div className="no-notes text-sidebar-foreground">No notes available</div>
      )}

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
