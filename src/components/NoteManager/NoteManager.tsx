import { memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./NoteManager.css";
import type { ISynctexBlockId } from "@fluffylabs/links-metadata";
import { Button, Textarea } from "@fluffylabs/shared-ui";
import { twMerge } from "tailwind-merge";
import { validateMath } from "../../utils/validateMath";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { LABEL_LOCAL } from "../NotesProvider/consts/labels";
import type { IDecoratedNote } from "../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../NotesProvider/types/StorageNote";
import { Selection } from "../Selection/Selection";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { NotesList } from "./components/NotesList";

const DEFAULT_AUTHOR = "";

export function NoteManager({ className }: { className?: string }) {
  return (
    <div className={twMerge("notes-wrapper gap-4", className)}>
      <Selection />
      <Notes />
    </div>
  );
}

const MemoizedNotesList = memo(NotesList);

function Notes() {
  const [noteContent, setNoteContent] = useState("");
  const [noteContentError, setNoteContentError] = useState("");
  const { locationParams, setLocationParams } = useContext(LocationContext) as ILocationContext;
  const { notesReady, activeNotes, notes, handleAddNote, handleDeleteNote, handleUpdateNote } = useContext(
    NotesContext,
  ) as INotesContext;
  const { selectedBlocks, pageNumber, handleClearSelection } = useContext(SelectionContext) as ISelectionContext;

  const handleAddNoteRef = useRef(handleAddNote);
  handleAddNoteRef.current = handleAddNote;
  const handleDeleteNoteRef = useRef(handleDeleteNote);
  handleDeleteNoteRef.current = handleDeleteNote;
  const handleUpdateNoteRef = useRef(handleUpdateNote);
  handleUpdateNoteRef.current = handleUpdateNote;

  const memoizedHandleDeleteNote = useCallback((note: IDecoratedNote) => {
    handleDeleteNoteRef.current(note);
  }, []);

  const memoizedHandleUpdateNote = useCallback((note: IDecoratedNote, newNote: IStorageNote) => {
    handleUpdateNoteRef.current(note, newNote);
  }, []);

  const handleAddNoteClick = useCallback(() => {
    if (
      selectedBlocks.length === 0 ||
      pageNumber === null ||
      !locationParams.selectionStart ||
      !locationParams.selectionEnd
    ) {
      throw new Error("Attempted saving a note without selection.");
    }

    setNoteContentError("");

    const mathValidationError = validateMath(noteContent);

    if (mathValidationError) {
      setNoteContentError(mathValidationError);
      return;
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
    handleClearSelection();
  }, [noteContent, pageNumber, selectedBlocks, handleClearSelection, locationParams]);

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

  useEffect(() => {
    if (selectedBlocks.length === 0) {
      setNoteContent("");
      setNoteContentError("");
    }
  }, [selectedBlocks]);

  return (
    <div className="note-manager flex flex-col gap-2.5" style={{ opacity: notesReady ? 1.0 : 0.3 }}>
      <div className="flex flex-col p-2 gap-2">
        <Textarea
          disabled={selectedBlocks.length === 0}
          className={noteContentError ? "error" : ""}
          autoFocus
          value={noteContent}
          onChange={(ev) => setNoteContent(ev.currentTarget.value)}
          placeholder="Add a note to the selected fragment. Math typesetting is supported! Use standard delimiters such as $...$, \[...\] or \begin{equation}...\end{equation}."
        />

        {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
        <Button disabled={noteContent.length < 1} onClick={handleAddNoteClick} variant="secondary">
          Add
        </Button>
      </div>

      <MemoizedNotesList
        activeNotes={activeNotes}
        notes={notes}
        onEditNote={memoizedHandleUpdateNote}
        onDeleteNote={memoizedHandleDeleteNote}
        onSelectNote={memoizedHandleSelectNote}
      />
    </div>
  );
}
