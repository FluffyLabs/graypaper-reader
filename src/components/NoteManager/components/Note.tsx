import {
  type ChangeEvent,
  type MouseEventHandler,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { validateMath } from "../../../utils/validateMath";
import { NoteContent } from "../../NoteContent/NoteContent";
import type { INotesContext } from "../../NotesProvider/NotesProvider";
import { type IDecoratedNote, NoteSource } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote, UnPrefixedLabel } from "../../NotesProvider/types/StorageNote";
import { NoteLabels, NoteLabelsEdit } from "./NoteLabels";
import { NoteLink } from "./NoteLink";
import "./Note.css";
import { Button, cn } from "@fluffylabs/shared-ui";
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

const noteContext = createContext<IDecoratedNote | null>(null);

const useNoteContext = () => {
  const context = useContext(noteContext);
  if (!context) {
    throw new Error("useNoteContext must be used within a NoteContextProvider");
  }
  return context;
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

  const handleWholeNoteClick = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const handleNoteEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") {
      e.preventDefault();
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

  useEffect(() => {
    if (!active) {
      setIsEditing(false);
    }
  }, [active]);

  return (
    <NoteLayout.Root value={note}>
      <div
        className={cn(
          "note rounded-xl p-4 flex flex-col gap-2",
          active && "bg-[var(--active-note-bg)]",
          !active && "bg-[var(--inactive-note-bg)] cursor-pointer",
        )}
        onClick={handleWholeNoteClick}
        onKeyDown={handleNoteEnter}
      >
        {!active && (
          <>
            <NoteLink note={note} onEditNote={onEditNote} />
            <NoteLayout.Text />
          </>
        )}
        {active && !isEditing && (
          <>
            <div className="flex justify-between items-start">
              <NoteLink note={note} onEditNote={onEditNote} />
              {isEditable && (
                <Button
                  variant="ghost"
                  intent="neutralStrong"
                  className="p-2 h-8"
                  data-testid={isEditing ? "save-button" : "edit-button"}
                  onClick={isEditing ? handleSaveClick : handleEditClick}
                >
                  ✏️
                </Button>
              )}
            </div>
            <NoteLayout.Text />
            {!isEditing ? <NoteLabels note={note} /> : null}
          </>
        )}
        {active && isEditing && (
          <>
            <>
              <NoteLink note={note} onEditNote={onEditNote} />
              <textarea
                className={noteContentError ? "error" : ""}
                onChange={handleNoteContentChange}
                value={noteDirty.content}
                autoFocus
              />
              {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
              <NoteLabelsEdit note={note} onNewLabels={handleEditLabels} />
              <div className="actions gap-2">
                <Button variant="tertiary" intent="destructive" size="sm" onClick={handleDeleteClick}>
                  Delete
                </Button>
                <div className="fill" />
                <Button data-testid={"save-button"} onClick={handleSaveClick} size="sm">
                  Save
                </Button>
                <Button variant="secondary" data-testid={"cancel-button"} onClick={handleCancelClick} size="sm">
                  Cancel
                </Button>
              </div>
            </>
          </>
        )}
      </div>
    </NoteLayout.Root>
  );
}

const NoteText = () => {
  const note = useNoteContext();

  return (
    <blockquote className="whitespace-pre-wrap">
      {note.original.author}
      <NoteContent content={note.original.content} />
    </blockquote>
  );
};

const NoteLayout = {
  Root: noteContext.Provider,
  Text: NoteText,
};
