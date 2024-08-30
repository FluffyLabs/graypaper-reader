import { type ChangeEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./NoteManager.css";
import { Note, type NotesItem } from "./Note";
import { IHighlightNote, INotesContext, NotesContext } from "../NotesProvider/NotesProvider";
import { CodeSyncContext, ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { subtractBorder } from "../../utils/subtractBorder";

type INoteManagerProps = {
  version: string;
};

export function NoteManager({ version }: INoteManagerProps) {
  const { notes, canUndo, handleAddNote, handleDeleteNote, handleUndo } = useContext(NotesContext) as INotesContext;
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteBlocks, setNewNoteBlocks] = useState<IHighlightNote["blocks"]>();
  const [newNotePageNumber, setNewNotePageNumber] = useState<number>();
  const { getSynctexBlockAtLocation } = useContext(CodeSyncContext) as ICodeSyncContext;
  const [selectionPageElement, setSelectionPageElement] = useState<HTMLElement>();

  const handleAddNoteClick = useCallback(() => {
    if (newNoteBlocks === undefined || newNotePageNumber === undefined) return;

    const newNote: IHighlightNote = {
      content: newNoteContent,
      date: Date.now(),
      author: "author",
      pageNumber: newNotePageNumber,
      blocks: newNoteBlocks,
    };

    handleAddNote(newNote);
  }, [newNoteContent, newNoteBlocks, newNotePageNumber, handleAddNote]);

  const handleSelectionChange = useCallback(() => {
    const selection = document.getSelection();

    if (!selection || !selection.anchorNode) return;

    const anchorElement = "closest" in selection.anchorNode ? selection.anchorNode : selection.anchorNode.parentElement;

    if (!anchorElement) return;

    setSelectionPageElement((anchorElement as Element).closest(".page") as HTMLElement);
  }, []);

  const handleTextareaFocus = useCallback(() => {
    const selection = document.getSelection();

    if (!selectionPageElement || !selection) {
      return;
    }

    const pageRect = subtractBorder(selectionPageElement.getBoundingClientRect(), selectionPageElement);
    const pageNumber = Number.parseInt(selectionPageElement.dataset.pageNumber || "");
    const synctexBlocks = [];

    for (const rect of selection.getRangeAt(0).getClientRects()) {
      const synctexBlock = getSynctexBlockAtLocation(
        (rect.left + rect.width / 2 - pageRect.left) / pageRect.width,
        (rect.top + rect.height / 2 - pageRect.top) / pageRect.height,
        pageNumber
      );

      if (synctexBlock && synctexBlocks.indexOf(synctexBlock) === -1) {
        synctexBlocks.push(synctexBlock);
      }
    }

    if (synctexBlocks.length) {
      setNewNoteBlocks(synctexBlocks);
      setNewNotePageNumber(pageNumber);
    }
  }, [selectionPageElement, getSynctexBlockAtLocation]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

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
          disabled={!selectionPageElement && !newNoteBlocks}
          autoFocus
          value={newNoteContent}
          onChange={(ev) => setNewNoteContent(ev.currentTarget.value)}
          onFocus={handleTextareaFocus}
          placeholder="Add a note to the selected fragment."
        />
        <button disabled={newNoteContent.length < 1 || !newNoteBlocks} onClick={handleAddNoteClick}>
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
