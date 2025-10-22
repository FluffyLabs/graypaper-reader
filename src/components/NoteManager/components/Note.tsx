import { type ChangeEvent, type MouseEventHandler, useCallback, useContext, useState } from "react";
import { validateMath } from "../../../utils/validateMath";
import { NoteContent } from "../../NoteContent/NoteContent";
import type { INotesContext } from "../../NotesProvider/NotesProvider";
import { type IDecoratedNote, NoteSource } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote, UnPrefixedLabel } from "../../NotesProvider/types/StorageNote";
import { NoteLabels, NoteLabelsEdit } from "./NoteLabels";
import { NoteLink } from "./NoteLink";
import "./Note.css";
import { cn } from "@fluffylabs/shared-ui";
import { type ILocationContext, LocationContext } from "../../LocationProvider/LocationProvider";

export type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};

type NoteProps = {
  note: IDecoratedNote;
  active: boolean;
  onEditNote: INotesContext["handleUpdateNote"];
  onDeleteNote: INotesContext["handleDeleteNote"];
};

export function Note({ note, active = false, onEditNote, onDeleteNote }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDirty, setNoteDirty] = useState<IStorageNote>({
    ...note.original,
  });
  const [noteContentError, setNoteContentError] = useState("");

  const { setLocationParams } = useContext(LocationContext) as ILocationContext;

  const isEditable = note.source !== NoteSource.Remote;

  const handleEditLabels = useCallback(
    (labels: UnPrefixedLabel[]) => {
      noteDirty.labels = [...new Set(labels)];
      setNoteDirty({ ...noteDirty });
    },
    [noteDirty],
  );

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

  const handleWholeNoteClick = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target;

    if (target instanceof Element && (target.closest("button") || target.closest("a"))) {
      e.preventDefault();
      return;
    }

    if (active) {
      return;
    }

    setLocationParams({
      version: note.original.version,
      selectionStart: note.original.selectionStart,
      selectionEnd: note.original.selectionEnd,
    });
  };

  return (
    <div
      className={cn(
        "note",
        active && "bg-[var(--active-note-bg)]",
        !active && "bg-[var(--inactive-note-bg)] cursor-pointer",
      )}
      onClick={handleWholeNoteClick}
      onKeyDown={handleWholeNoteClick}
    >
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
          {note.original.author}
          <NoteContent content={note.original.content} />
        </blockquote>
      )}
      {isEditing ? <NoteLabelsEdit note={note} onNewLabels={handleEditLabels} /> : null}
      <div className="actions">
        {!isEditing ? <NoteLabels note={note} /> : null}

        {isEditing ? (
          <button className="remove default-button" onClick={handleDeleteClick}>
            delete
          </button>
        ) : null}

        <div className="fill" />

        {isEditable ? (
          <button
            className={`default-button ${isEditing ? "save" : "edit"}`}
            data-testid={isEditing ? "save-button" : "edit-button"}
            onClick={isEditing ? handleSaveClick : handleEditClick}
          >
            {isEditing ? "save" : "✏️"}
          </button>
        ) : null}

        {isEditing ? <button onClick={handleCancelClick}>cancel</button> : null}
      </div>
    </div>
  );
}
