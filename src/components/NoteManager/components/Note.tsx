import {
  type ChangeEvent,
  type MouseEventHandler,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { type ISelectionContext, SelectionContext } from "../../SelectionProvider/SelectionProvider";

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

const noteContext = createContext<{
  note: IDecoratedNote;
  isEditable: boolean;
  handleEditClick: () => void;
  onEditNote: INotesContext["handleUpdateNote"];
  isEditing: boolean;
} | null>(null);

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
    if (e.key !== "Enter" && e.key !== "Space") {
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

  const noteLayoutContext = useMemo(
    () => ({
      note,
      isEditable,
      handleEditClick,
      onEditNote,
      isEditing,
    }),
    [note, isEditable, handleEditClick, onEditNote, isEditing],
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
            <NoteLink note={note} onEditNote={onEditNote} />
            <NoteLayout.Text />
          </>
        )}
        {active && !isEditing && (
          <>
            <NoteLayout.SelectedText />
            <NoteLayout.Text />
            {!isEditing ? <NoteLabels note={note} /> : null}
          </>
        )}
        {active && isEditing && (
          <>
            <>
              <NoteLayout.SelectedText />
              <textarea
                className={noteContentError ? "error" : ""}
                onChange={handleNoteContentChange}
                value={noteDirty.content}
                autoFocus
              />
              {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
              <NoteLabelsEdit note={note} onNewLabels={handleEditLabels} />
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

const NoteText = () => {
  const { note } = useNoteContext();

  return (
    <blockquote className="whitespace-pre-wrap">
      {note.original.author}
      <NoteContent content={note.original.content} />
    </blockquote>
  );
};

const SelectedText = () => {
  const { selectionString } = useContext(SelectionContext) as ISelectionContext;
  const { handleEditClick, isEditable, note, onEditNote, isEditing } = useNoteContext();

  return (
    <div className="px-6 py-3 bg-sidebar rounded-md border-brand-primary border">
      <div className="flex justify-between">
        <NoteLink note={note} onEditNote={onEditNote} />
        {isEditable && !isEditing && (
          <Button
            variant="ghost"
            intent="neutralStrong"
            className="p-2 h-6 -top-0.5 relative"
            data-testid={"edit-button"}
            onClick={handleEditClick}
          >
            ✏️
          </Button>
        )}
      </div>
      <blockquote className="italic">{selectionString}</blockquote>
    </div>
  );
};

const NoteLayout = {
  Root: noteContext.Provider,
  Text: NoteText,
  SelectedText: SelectedText,
};
