import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import type { IHighlightNote, INotesContext, TAnyNote } from "../NotesProvider/NotesProvider";
import { NoteLink } from "./NoteLink";

export type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};

type NoteProps = {
  version: string;
  note: TAnyNote;
  onEditNote: INotesContext["handleUpdateNote"];
  onDeleteNote: INotesContext["handleDeleteNote"];
};

export function Note({ note, onEditNote, onDeleteNote, version }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDirty, setNoteDirty] = useState({ ...note });

  useEffect(() => {
    setNoteDirty({ ...note });
  }, [note]);

  const toggleEdit = useCallback(() => {
    if (isEditing) {
      // defer change to prevent onBlur happening before clicks.
      setTimeout(() => {
        onEditNote(note, noteDirty);
        setIsEditing(false);
      }, 300);
    } else {
      setIsEditing(true);
    }
  }, [onEditNote, note, noteDirty, isEditing]);

  const handleNoteContentChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteDirty({ ...noteDirty, content: ev.currentTarget.value });
  };

  const handleDeleteClick = useCallback(() => {
    onDeleteNote(note);
  }, [note, onDeleteNote]);

  return (
    <li>
      <NoteLink note={note as IHighlightNote} version={version} onEditNote={onEditNote} />
      {isEditing ? (
        <textarea onChange={handleNoteContentChange} value={noteDirty.content} onBlur={toggleEdit} autoFocus />
      ) : (
        <blockquote onClick={toggleEdit} onKeyPress={toggleEdit}>
          {note.content}
        </blockquote>
      )}
      {isEditing ? (
        <button className="remove" onClick={handleDeleteClick}>
          delete
        </button>
      ) : null}
    </li>
  );
}
