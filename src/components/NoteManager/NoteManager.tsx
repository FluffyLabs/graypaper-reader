import { type ChangeEventHandler, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./NoteManager.css";
import { Tooltip } from "react-tooltip";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { LEGACY_READER_HOST } from "../MetadataProvider/MetadataProvider";
import { type IHighlightNote, type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { Note } from "./Note";
import { validateTeX } from "../../utils/validateTeX";

const DEFAULT_AUTHOR = "";

export function NoteManager() {
  const [noteContent, setNoteContent] = useState("");
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const {
    notes,
    canUndo,
    hasLegacyNotes,
    handleAddNote,
    handleDeleteNote,
    handleUpdateNote,
    handleUndo,
    handleImport,
    handleExport,
    handleLegacyExport,
  } = useContext(NotesContext) as INotesContext;
  const { selectionString, selectedBlocks, pageNumber, handleClearSelection } = useContext(
    SelectionContext,
  ) as ISelectionContext;

  const handleAddNoteClick = useCallback(() => {
    if (
      selectedBlocks.length === 0 ||
      pageNumber === null ||
      !locationParams.selectionStart ||
      !locationParams.selectionEnd
    )
      throw new Error("Attempted saving a note without selection.");

    const texValidationError = validateTeX(noteContent);

    if (texValidationError) {
      alert(`LaTeX validation failed: ${texValidationError}`);
      return;
    }

    const newNote: IHighlightNote = {
      content: noteContent,
      date: Date.now(),
      author: DEFAULT_AUTHOR,
      pageNumber,
      selectionStart: locationParams.selectionStart,
      selectionEnd: locationParams.selectionEnd,
      selectionString,
      version: locationParams.version,
    };

    handleAddNote(newNote);
    handleClearSelection();
  }, [noteContent, pageNumber, selectionString, selectedBlocks, handleAddNote, handleClearSelection, locationParams]);

  useEffect(() => {
    if (selectedBlocks.length === 0) {
      setNoteContent("");
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
      const f = new FileReader();
      f.onload = (e) => {
        try {
          handleImport(e.target?.result?.toString() || "");
        } catch (e) {
          console.error(e);
          alert("Unable to load the notes file. Check console for details.");
        }
      };
      f.readAsText(ev.target.files[0]);
    },
    [handleImport],
  );

  return (
    <div className="note-manager">
      <div className="new-note">
        <textarea
          disabled={selectedBlocks.length === 0}
          autoFocus
          value={noteContent}
          onChange={(ev) => setNoteContent(ev.currentTarget.value)}
          placeholder="Add a note to the selected fragment."
        />
        <button disabled={noteContent.length < 1} onClick={handleAddNoteClick}>
          Add
        </button>
      </div>
      <ul>
        {notes.map((note) => (
          <Note
            version={locationParams.version}
            key={note.date}
            note={note}
            onEditNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        ))}
      </ul>
      <div className="actions">
        {canUndo && <button onClick={handleUndo}>undo</button>}
        <button onClick={onImport}>import notes</button>
        <button onClick={handleExport}>export notes</button>
        {hasLegacyNotes ? (
          <button
            data-tooltip-id="legacy-export-tooltip"
            data-tooltip-content={`Notes from the old version of graypaper reader have been detected. You may export them for use with ${LEGACY_READER_HOST}/.`}
            data-tooltip-place="bottom"
            onClick={handleLegacyExport}
          >
            export old notes
          </button>
        ) : null}
        <input ref={fileImport} onChange={handleFileSelected} type="file" style={{ opacity: 0 }} />
      </div>
      <Tooltip id="legacy-export-tooltip" />
    </div>
  );
}
