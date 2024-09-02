import { useCallback, useContext, useEffect, useState } from "react";
import "./NoteManager.css";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type IHighlightNote, type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

const DEFAULT_AUTHOR = "Anonymous";

type INoteManagerProps = {
  version: string;
};

export function NoteManager({ version }: INoteManagerProps) {
  const [noteContent, setNoteContent] = useState("");
  const { notes, canUndo, handleAddNote, handleDeleteNote, handleUndo } = useContext(NotesContext) as INotesContext;
  const { getSynctexBlockAtLocation } = useContext(CodeSyncContext) as ICodeSyncContext;
  const { selectedBlocks, pageNumber, handleClearSelection } = useContext(SelectionContext) as ISelectionContext;

  const handleAddNoteClick = useCallback(() => {
    if (selectedBlocks.length === 0 || pageNumber === null)
      throw new Error("Attempted saving a note without selection.");

    const newNote: IHighlightNote = {
      content: noteContent,
      date: Date.now(),
      author: DEFAULT_AUTHOR,
      pageNumber,
      blocks: selectedBlocks,
    };

    handleAddNote(newNote);
    handleClearSelection();
  }, [noteContent, pageNumber, selectedBlocks, handleAddNote, handleClearSelection]);

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
      {/* <ul>
        {notes.map((x, idx) => (
          <Note
            selection={selection}
            version={version}
            key={`${idx}-${x.location}`}
            note={x}
            onEditNote={onEditNote}
            onRemoveNote={handleDeleteClick}
          />
        ))}
      </ul> */}
      <div className="actions">
        {canUndo && <button onClick={handleUndo}>undo</button>}
        {/* <button onClick={onImport}>import notes</button>
        <button onClick={onExport}>export notes</button>
        <input ref={fileImport} onChange={importNotes} type="file" style={{ opacity: 0 }} /> */}
      </div>
    </div>
  );
}
