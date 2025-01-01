import { type ChangeEventHandler, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./NoteManager.css";
import { Tooltip } from "react-tooltip";
import { validateMath } from "../../utils/validateMath";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { LEGACY_READER_HOST } from "../MetadataProvider/MetadataProvider";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { LABEL_LOCAL } from "../NotesProvider/consts/labels";
import type { IStorageNote } from "../NotesProvider/types/StorageNote";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { Note } from "./Note";
import { LabelsFilter } from "./NoteLabels";

const DEFAULT_AUTHOR = "";

export function NoteManager() {
  const [noteContent, setNoteContent] = useState("");
  const [noteContentError, setNoteContentError] = useState("");
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const {
    notes,
    labels,
    canUndo,
    canRedo,
    hasLegacyNotes,
    handleAddNote,
    handleDeleteNote,
    handleUpdateNote,
    handleUndo,
    handleRedo,
    handleImport,
    handleExport,
    handleLegacyExport,
    handleToggleLabel,
  } = useContext(NotesContext) as INotesContext;
  const { selectedBlocks, pageNumber, handleClearSelection } = useContext(SelectionContext) as ISelectionContext;

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
      // TODO [ToDr] user defined labels?
      labels: [LABEL_LOCAL],
    };

    handleAddNote(newNote);
    handleClearSelection();
  }, [noteContent, pageNumber, selectedBlocks, handleAddNote, handleClearSelection, locationParams]);

  useEffect(() => {
    if (selectedBlocks.length === 0) {
      setNoteContent("");
      setNoteContentError("");
    }
  }, [selectedBlocks]);

  const fileImport = useRef<HTMLInputElement>(null);
  const onImport = useCallback(() => {
    fileImport.current?.click();
  }, []);

  const handleFileSelected = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (ev) => {
      if (!ev.target?.files?.length) {
        return;
      }
      const fileToImport = ev.target.files[0];

      const f = new FileReader();
      f.onload = (e) => {
        const fileContent = e.target?.result?.toString() || "";
        try {
          handleImport(fileContent, fileToImport.name.substring(0, 12));
        } catch (e) {
          console.error(e);
          alert("Unable to load the notes file. Check console for details.");
        }
      };
      f.readAsText(fileToImport);
    },
    [handleImport],
  );

  return (
    <div className="note-manager">
      <div className="new-note">
        <textarea
          disabled={selectedBlocks.length === 0}
          className={noteContentError ? "error" : ""}
          autoFocus
          value={noteContent}
          onChange={(ev) => setNoteContent(ev.currentTarget.value)}
          placeholder="Add a note to the selected fragment. Math typesetting is supported! Use standard delimiters such as $...$, \[...\] or \begin{equation}...\end{equation}."
        />
        {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
        <button disabled={noteContent.length < 1} onClick={handleAddNoteClick}>
          Add
        </button>
      </div>
      <LabelsFilter labels={labels} onToggleLabel={handleToggleLabel} />
      {notes.map((note) => (
        <Note key={note.key} note={note} onEditNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />
      ))}
      <div className="notes-actions">
        {canUndo && <button onClick={handleUndo}>undo</button>}
        {canRedo && <button onClick={handleRedo}>redo</button>}
        <button onClick={onImport}>import notes</button>
        <button onClick={handleExport}>export notes</button>
        {hasLegacyNotes ? (
          <button
            data-tooltip-id="legacy-export-tooltip"
            data-tooltip-content={`Notes from the old version of graypaper reader have been detected. You may export them for use with ${LEGACY_READER_HOST}.`}
            data-tooltip-place="bottom"
            onClick={handleLegacyExport}
          >
            export old notes
          </button>
        ) : null}
      </div>
      <input ref={fileImport} onChange={handleFileSelected} type="file" style={{ opacity: 0 }} />
      <Tooltip id="legacy-export-tooltip" />
    </div>
  );
}
