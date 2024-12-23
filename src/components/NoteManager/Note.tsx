import { type ChangeEvent, type MouseEventHandler, useCallback, useState } from "react";
import { validateMath } from "../../utils/validateMath";
import { type INote, type INoteV3, type INotesContext, NoteSource } from "../NotesProvider/NotesProvider";
import { RenderMath } from "../RenderMath/RenderMath";
import { NoteLabels } from "./NoteLabels";
import { NoteLink } from "./NoteLink";

export type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};

type NoteProps = {
  note: INote;
  onEditNote: INotesContext["handleUpdateNote"];
  onDeleteNote: INotesContext["handleDeleteNote"];
};

export function Note({ note, onEditNote, onDeleteNote }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDirty, setNoteDirty] = useState<INoteV3>({ ...note.original });
  const [noteContentError, setNoteContentError] = useState("");

  const isEditable = note.source !== NoteSource.Remote;

  const handleSaveClick = useCallback<MouseEventHandler>(() => {
    const mathValidationError = validateMath(noteDirty.content);
    setNoteContentError("");

    if (mathValidationError) {
      setNoteContentError(mathValidationError);
      return;
    }

    onEditNote(note, noteDirty);
    setIsEditing(false);
  }, [note, noteDirty, onEditNote]);

  const handleEditClick = useCallback(() => {
    if (!isEditable) {
      return;
    }
    setIsEditing(true);
    setNoteDirty({ ...note.original });
    setNoteContentError("");
  }, [note, isEditable]);

  const handleNoteContentChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteDirty({ ...noteDirty, content: ev.currentTarget.value });
  };

  const handleDeleteClick = useCallback(() => {
    onDeleteNote(note);
  }, [note, onDeleteNote]);

  const handleCancelClick = useCallback(() => {
    setNoteContentError("");
    setIsEditing(false);
  }, []);

  return (
    <div className="note">
      <NoteLink note={note} onEditNote={onEditNote} />
      {isEditing ? (
        <>
          <textarea
            className={noteContentError ? "error" : ""}
            onChange={handleNoteContentChange}
            value={noteDirty.content}
            autoFocus
          />
          {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
        </>
      ) : (
        <blockquote>
          <RenderMath content={note.original.content} />
        </blockquote>
      )}
      <div className="actions">
        {!isEditing ? <NoteLabels note={note} /> : null}

        {isEditing ? (
          <button className="remove" onClick={handleDeleteClick}>
            delete
          </button>
        ) : null}

        <div className="fill" />

        {isEditable ? (
          <button className={isEditing ? "save" : "edit"} onClick={isEditing ? handleSaveClick : handleEditClick}>
            {isEditing ? "save" : "✏️"}
          </button>
        ) : null}

        {isEditing ? <button onClick={handleCancelClick}>cancel</button> : null}
      </div>
    </div>
  );
}
