import { Button, cn } from "@fluffylabs/shared-ui";
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { validateMath } from "../../../utils/validateMath";
import type { INotesContext } from "../../NotesProvider/NotesProvider";
import { type IDecoratedNote, NoteSource } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../../NotesProvider/types/StorageNote";
import { NoteLayout } from "./NoteLayout";
import { NoteLink } from "./NoteLink";

export type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};

type NoteProps = {
  note: IDecoratedNote;
  active: boolean;
  onEditNote: INotesContext["handleUpdateNote"];
  onDeleteNote: INotesContext["handleDeleteNote"];
  onSelectNote: (note: IDecoratedNote, deactivate?: boolean) => void;
};

export function Note({ note, active = false, onEditNote, onDeleteNote, onSelectNote }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDirty, setNoteDirty] = useState<IStorageNote>({
    ...note.original,
  });
  const [noteContentError, setNoteContentError] = useState("");

  const isEditable = note.source !== NoteSource.Remote;

  const handleSaveClick = useCallback(() => {
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

  const handleNoteLabelsChange = useCallback((labels: string[]) => {
    setNoteDirty((prevNoteDirty) => ({ ...prevNoteDirty, labels }));
  }, []);

  const handleNoteContentChange = useCallback((ev: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteDirty((prev) => ({ ...prev, content: ev.currentTarget.value }));
  }, []);

  const handleDeleteClick = useCallback(() => {
    onDeleteNote(note);
  }, [note, onDeleteNote]);

  const handleCancelClick = useCallback(() => {
    setNoteContentError("");
    setIsEditing(false);
  }, []);

  const handleWholeNoteClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target;

    if (target instanceof Element && (target.closest("button") || target.closest("a"))) {
      e.preventDefault();
      return;
    }

    if (active) {
      return;
    }

    onSelectNote(note);
  };

  const handleNoteEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target instanceof Element && (e.target.closest("input") || e.target.closest("textarea"))) {
      return;
    }

    const isActivation = e.key === "Enter" || e.key === " " || e.code === "Space";
    if (!isActivation) return;

    e.preventDefault();

    if (active) {
      return;
    }

    onSelectNote(note);
  };

  useEffect(() => {
    if (!active) {
      setIsEditing(false);
    }
  }, [active]);

  const onSelectNoteRef = useRef<NoteProps["onSelectNote"] | undefined>(undefined);
  onSelectNoteRef.current = onSelectNote;

  const memoizedOnSelectNote = useCallback(
    (deactivate?: boolean) => {
      onSelectNoteRef.current?.(note, deactivate);
    },
    [note],
  );

  const noteLayoutContext = useMemo(
    () => ({
      active,
      note,
      isEditable,
      handleEditClick,
      handleSaveClick,
      handleCancelClick,
      onEditNote,
      isEditing,
      noteDirty,
      handleNoteContentChange,
      handleNoteLabelsChange,
      handleSelectNote: memoizedOnSelectNote,
    }),
    [
      active,
      note,
      isEditable,
      handleEditClick,
      handleSaveClick,
      handleCancelClick,
      onEditNote,
      isEditing,
      noteDirty,
      handleNoteContentChange,
      handleNoteLabelsChange,
      memoizedOnSelectNote,
    ],
  );

  return (
    <NoteLayout.Root value={noteLayoutContext}>
      <div
        data-testid="notes-manager-card"
        className={cn(
          "note rounded-xl p-4 flex flex-col gap-2",
          active && "bg-[var(--active-note-bg)] shadow-[0px_4px_0px_1px_var(--active-note-shadow-bg)] mb-1",
          !active && "bg-[var(--inactive-note-bg)] cursor-pointer",
        )}
        role={!active ? "button" : undefined}
        tabIndex={!active ? 0 : undefined}
        aria-label={!active ? "Activate label" : ""}
        onClick={handleWholeNoteClick}
        onKeyDown={handleNoteEnter}
      >
        {!active && (
          <>
            <NoteLink note={note} active={false} />
            <div className="flex justify-between items-end max-w-[100%]">
              <NoteLayout.Text />
              <NoteLayout.Dropdown />
            </div>
          </>
        )}
        {active && !isEditing && (
          <>
            <NoteLayout.SelectedText />
            <NoteLayout.Text />
            <div className="flex justify-between items-end max-w-[100%]">
              <NoteLayout.Labels />
              <NoteLayout.Dropdown />
            </div>
          </>
        )}
        {active && isEditing && (
          <>
            <>
              <NoteLayout.SelectedText />
              <NoteLayout.TextArea className={noteContentError ? "error" : ""} />
              {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
              <NoteLayout.Labels />
              <div className="actions gap-2">
                <Button variant="ghost" intent="destructive" size="sm" onClick={handleDeleteClick}>
                  Delete
                </Button>
                <div className="fill" />
                <Button variant="tertiary" data-testid={"cancel-button"} onClick={handleCancelClick} size="sm">
                  Cancel
                </Button>
                <Button data-testid={"save-button"} onClick={handleSaveClick} size="sm">
                  Save
                </Button>
              </div>
            </>
          </>
        )}
      </div>
    </NoteLayout.Root>
  );
}
