import {
  type ChangeEvent,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import { validateMath } from "../../utils/validateMath";
import type { IHighlightNote, INotesContext, TAnyNote } from "../NotesProvider/NotesProvider";
import { RenderMath } from "../RenderMath/RenderMath";
import { NoteLink } from "./NoteLink";

export type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};

type NoteProps = {
  version: string;
  note: TAnyNote;
  noteMigrated: TAnyNote | undefined;
  onEditNote: INotesContext["handleUpdateNote"];
  onDeleteNote: INotesContext["handleDeleteNote"];
};

export function Note({ note, noteMigrated, onEditNote, onDeleteNote, version }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDirty, setNoteDirty] = useState({ ...note });
  const [noteContentError, setNoteContentError] = useState("");
  const editTimeoutIdRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBlur = useCallback<FocusEventHandler<HTMLTextAreaElement>>(
    (e) => {
      const target = e.currentTarget;

      // defer change to prevent onBlur happening before clicks.
      editTimeoutIdRef.current = setTimeout(() => {
        const mathValidationError = validateMath(noteDirty.content);
        setNoteContentError("");

        if (mathValidationError) {
          setNoteContentError(mathValidationError);
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
    setNoteContentError("");
  }, [note]);

  const handleNoteContentChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteDirty({ ...noteDirty, content: ev.currentTarget.value });
  };

  const handleDeleteClick = useCallback(() => {
    clearTimeout(editTimeoutIdRef.current);
    onDeleteNote(note);
  }, [note, onDeleteNote]);

  const handleCancelClick = useCallback(() => {
    clearTimeout(editTimeoutIdRef.current);
    setNoteContentError("");
    setIsEditing(false);
  }, []);

  return (
    <li>
      {noteMigrated ? (
        <NoteLink
          note={note as IHighlightNote}
          noteMigrated={noteMigrated as IHighlightNote}
          version={version}
          onEditNote={onEditNote}
        />
      ) : (
        <>Loading...</>
      )}
      {isEditing ? (
        <>
          <textarea
            className={noteContentError ? "error" : ""}
            onChange={handleNoteContentChange}
            value={noteDirty.content}
            onBlur={handleBlur}
            autoFocus
          />
          {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
        </>
      ) : (
        <blockquote onClick={handleEdit as MouseEventHandler} onKeyUp={handleEdit as KeyboardEventHandler}>
          <RenderMath content={note.content} />
        </blockquote>
      )}
      {isEditing && noteContentError ? (
        <button type="button" onClick={handleCancelClick}>
          cancel
        </button>
      ) : null}
      {isEditing ? (
        <button className="remove" onClick={handleDeleteClick}>
          delete
        </button>
      ) : null}
    </li>
  );
}
