import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import "./Notes.css";
import type { InDocSelection } from "../../utils/IframeController";
import { deserializeLocation } from "../../utils/location";

type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};
type NotesList = NotesItem[];

type NotesProps = {
  version: string;
  selection: InDocSelection | null;
};
export function Notes({ selection }: NotesProps) {
  const [notes, setNotes] = useState(readNotes());
  const [newNote, setNewNote] = useState("");
  const [hasUndo, setHasUndo] = useState(false);

  useEffect(() => {
    writeNotes(notes);
    setHasUndo(true);
  }, [notes]);

  const addNote = useCallback(() => {
    notes.unshift({
      location: window.location.hash.substring(1),
      content: newNote,
    });
    setNewNote("");
    setNotes([...notes]);
  }, [newNote, notes]);

  const onEditNote = useCallback(
    (note: NotesItem) => {
      const idx = notes.indexOf(note);
      if (idx === -1) {
        return;
      }
      notes[idx] = { ...note };
      setNotes([...notes]);
    },
    [notes],
  );

  const onRemoveNote = useCallback(
    (note: NotesItem) => {
      const idx = notes.indexOf(note);
      if (idx === -1) {
        return;
      }
      notes.splice(idx, 1);
      setNotes([...notes]);
    },
    [notes],
  );

  const onUndo = useCallback(() => {
    const oldNotes = readNotes(true);
    setNotes(oldNotes);
  }, []);

  const onExport = useCallback(() => {
    const strNotes = JSON.stringify(notes);
    const link = document.createElement("a");
    link.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(strNotes)}`);
    link.setAttribute("download", `graypaper-notes-${new Date().toISOString()}.json`);
    link.click();
  }, [notes]);

  return (
    <div className="notes">
      <div className="newNote">
        <textarea
          disabled={!selection}
          autoFocus
          value={newNote}
          onChange={(ev) => setNewNote(ev.currentTarget.value)}
          placeholder="Add a note to the selected fragment."
        />
        <button disabled={newNote.length < 1} onClick={addNote}>Add</button>
      </div>
      <ul>
        {notes.map((x, idx) => (
          <Note key={`${idx}-${x.location}`} note={x} onEditNote={onEditNote} onRemoveNote={onRemoveNote} />
        ))}
      </ul>
      <div className="actions">
        {hasUndo && <button onClick={onUndo}>undo</button>}
        <button onClick={onExport}>export notes</button>
      </div>
    </div>
  );
}

type NoteProps = {
  note: NotesItem;
  onEditNote: (n: NotesItem) => void;
  onRemoveNote: (n: NotesItem) => void;
};
function Note({ note, onEditNote, onRemoveNote }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = useCallback(() => {
    if (isEditing) {
      // defer change to prevent onBlur happening before clicks.
      setTimeout(() => {
        setIsEditing(false);
      }, 300);
    } else {
      setIsEditing(true);
    }
  }, [isEditing]);

  const editNote = useCallback(
    (ev: ChangeEvent<HTMLTextAreaElement>) => {
      note.content = ev.currentTarget.value;
      onEditNote(note);
    },
    [note, onEditNote],
  );

  const removeNote = useCallback(() => {
    onRemoveNote(note);
  }, [note, onRemoveNote]);

  const locDetails = useMemo(() => {
    return deserializeLocation(note.location);
  }, [note]);

  return (
    <li>
      <a href={`#${note.location}`}>
        {locDetails ? (
          <span>
            p:{Number(`0x${locDetails?.page}`)} &gt; {locDetails.section} &gt; {locDetails.subSection}
          </span>
        ) : (
          "link"
        )}
      </a>
      {isEditing ? (
        <textarea onChange={editNote} value={note.content} onBlur={toggleEdit} autoFocus />
      ) : (
        <blockquote onClick={toggleEdit} onKeyPress={toggleEdit}>
          {note.content}
        </blockquote>
      )}
      <button className="remove" style={{ display: isEditing ? "block" : "none" }} onClick={removeNote}>
        delete
      </button>
    </li>
  );
}

function readNotes(isBackup?: boolean): NotesList {
  try {
    const key = isBackup ? "notes-backup" : "notes";
    const n = window.localStorage.getItem(key) ?? "[]";
    const read = JSON.parse(n);
    if (!Array.isArray(read)) {
      throw new Error("not an array");
    }
    return read;
  } catch (e) {
    console.warn("Error reading notes", e);
    return [];
  }
}

function writeNotes(notes: NotesList) {
  try {
    const oldNotes = readNotes();
    window.localStorage.setItem("notes-backup", JSON.stringify(oldNotes));

    window.localStorage.setItem("notes", JSON.stringify(notes));
  } catch (e) {
    alert(`unable to save notes: ${e}`);
  }
}
