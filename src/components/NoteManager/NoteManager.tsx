import { useCallback, useContext, useEffect, useState } from "react";
import "./NoteManager.css";
import { validateMath } from "../../utils/validateMath";
import { LabelsFilter } from "../LabelsFilter/LabelsFilter";
import {
  type ILocationContext,
  LocationContext,
} from "../LocationProvider/LocationProvider";
import {
  type INotesContext,
  NotesContext,
} from "../NotesProvider/NotesProvider";
import { LABEL_LOCAL } from "../NotesProvider/consts/labels";
import type { IStorageNote } from "../NotesProvider/types/StorageNote";
import {
  type ISelectionContext,
  SelectionContext,
} from "../SelectionProvider/SelectionProvider";
import { Note } from "./components/Note";
import { NotesActions } from "./components/NotesActions";

const DEFAULT_AUTHOR = "";

export function NoteManager() {
  return (
    <div className="notes-wrapper">
      <Notes />
      <NotesActions />
    </div>
  );
}

function Notes() {
  const [noteContent, setNoteContent] = useState("");
  const [noteContentError, setNoteContentError] = useState("");
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const {
    notesReady,
    notes,
    labels,
    handleAddNote,
    handleDeleteNote,
    handleUpdateNote,
    handleToggleLabel,
  } = useContext(NotesContext) as INotesContext;
  const { selectedBlocks, pageNumber, handleClearSelection } = useContext(
    SelectionContext,
  ) as ISelectionContext;

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

    handleAddNote(newNote);
    handleClearSelection();
  }, [
    noteContent,
    pageNumber,
    selectedBlocks,
    handleAddNote,
    handleClearSelection,
    locationParams,
  ]);

  useEffect(() => {
    if (selectedBlocks.length === 0) {
      setNoteContent("");
      setNoteContentError("");
    }
  }, [selectedBlocks]);

  return (
    <div className="note-manager" style={{ opacity: notesReady ? 1.0 : 0.3 }}>
      <div className="new-note">
        <textarea
          disabled={selectedBlocks.length === 0}
          className={noteContentError ? "error" : ""}
          autoFocus
          value={noteContent}
          onChange={(ev) => setNoteContent(ev.currentTarget.value)}
          placeholder="Add a note to the selected fragment. Math typesetting is supported! Use standard delimiters such as $...$, \[...\] or \begin{equation}...\end{equation}."
        />

        {noteContentError ? (
          <div className="validation-message">{noteContentError}</div>
        ) : null}
        <button
          disabled={noteContent.length < 1}
          onClick={handleAddNoteClick}
          className="default-button"
        >
          Add
        </button>
      </div>

      <LabelsFilter labels={labels} onToggleLabel={handleToggleLabel} />
      {notes.map((note) => (
        <Note
          key={note.key}
          note={note}
          onEditNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
      ))}
    </div>
  );
}
