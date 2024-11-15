import {
  type ChangeEvent,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import type { IHighlightNote, INotesContext, TAnyNote } from "../NotesProvider/NotesProvider";
import { NoteLink } from "./NoteLink";
import { validateTeX } from "../../utils/validateTeX";
import { TeX } from "../TeX/TeX";

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
  const editTimeoutIdRef = useRef<number>();

  const handleBlur = useCallback<FocusEventHandler<HTMLTextAreaElement>>(
    (e) => {
      const target = e.currentTarget;

      // defer change to prevent onBlur happening before clicks.
      editTimeoutIdRef.current = setTimeout(() => {
        const texValidationError = validateTeX(noteDirty.content);

        if (texValidationError) {
          alert(`LaTeX validation failed: ${texValidationError}`);
          setTimeout(() => {
            target.focus();
          }, 0);
          return;
        }

        onEditNote(note, noteDirty);
        setIsEditing(false);
      }, 300);
    },
    [note, noteDirty, onEditNote],
  );

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setNoteDirty({ ...note });
  }, [note]);

  const handleNoteContentChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteDirty({ ...noteDirty, content: ev.currentTarget.value });
  };

  const handleDeleteClick = useCallback(() => {
    onDeleteNote(note);
    clearTimeout(editTimeoutIdRef.current);
  }, [note, onDeleteNote]);

  return (
    <li>
      <NoteLink note={note as IHighlightNote} version={version} onEditNote={onEditNote} />
      {isEditing ? (
        <textarea onChange={handleNoteContentChange} value={noteDirty.content} onBlur={handleBlur} autoFocus />
      ) : (
        <blockquote onClick={handleEdit as MouseEventHandler} onKeyUp={handleEdit as KeyboardEventHandler}>
          <TeX>{note.content}</TeX>
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
