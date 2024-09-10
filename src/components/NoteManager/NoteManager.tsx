import { useCallback, useContext, useEffect, useState } from "react";
import "./NoteManager.css";
import { type IHighlightNote, type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";
import { Note } from "./Note";
import { ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";

const DEFAULT_AUTHOR = "";

export function NoteManager() {
  const [noteContent, setNoteContent] = useState("");
  const {
    locationParams: { version },
  } = useContext(LocationContext) as ILocationContext;
  const { notes, canUndo, handleAddNote, handleDeleteNote, handleUpdateNote, handleUndo } = useContext(
    NotesContext
  ) as INotesContext;
  const { selectionString, selectedBlocks, pageNumber, handleClearSelection } = useContext(
    SelectionContext
  ) as ISelectionContext;

  const handleAddNoteClick = useCallback(() => {
    if (selectedBlocks.length === 0 || pageNumber === null)
      throw new Error("Attempted saving a note without selection.");

    const newNote: IHighlightNote = {
      content: noteContent,
      date: Date.now(),
      author: DEFAULT_AUTHOR,
      pageNumber,
      blocks: selectedBlocks,
      selectionString,
      version,
    };

    handleAddNote(newNote);
    handleClearSelection();
  }, [noteContent, pageNumber, selectionString, selectedBlocks, handleAddNote, handleClearSelection, version]);

  useEffect(() => {
    if (selectedBlocks.length === 0) {
      setNoteContent("");
    }
  }, [selectedBlocks]);

  // const onExport = useCallback(() => {
  //   const strNotes = JSON.stringify(notes);
  //   const link = document.createElement("a");
  //   link.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(strNotes)}`);
  //   link.setAttribute("download", `graypaper-notes-${new Date().toISOString()}.json`);
  //   link.click();
  // }, [notes]);

  // const fileImport = useRef(null as HTMLInputElement | null);
  // const onImport = useCallback(() => {
  //   fileImport.current?.click();
  // }, []);

  // const importNotes = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
  //   if (!ev.target?.files?.length) {
  //     return;
  //   }
  //   const f = new FileReader();
  //   f.onload = (e) => {
  //     try {
  //       const notes = parseNotes(e.target?.result?.toString() ?? "");
  //       const overwrite = confirm(
  //         `Your current notes will be replaced with ${notes.length} notes loaded from the file. Continue?`
  //       );
  //       if (overwrite) {
  //         setNotes(notes);
  //       }
  //     } catch (e) {
  //       console.error(e);
  //       alert("Unable to load the notes file. Check console for details.");
  //     }
  //   };
  //   f.readAsText(ev.target.files[0]);
  // }, []);

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
            version={version}
            key={note.date}
            note={note}
            onEditNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        ))}
      </ul>
      <div className="actions">
        {canUndo && <button onClick={handleUndo}>undo</button>}
        {/* <button onClick={onImport}>import notes</button>
        <button onClick={onExport}>export notes</button>
        <input ref={fileImport} onChange={importNotes} type="file" style={{ opacity: 0 }} /> */}
      </div>
    </div>
  );
}
