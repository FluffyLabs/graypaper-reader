import { Button } from "@fluffylabs/shared-ui";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { validateMath } from "../../../utils/validateMath";
import { useVersionContext } from "../../LocationProvider/VersionProvider";
import { useGetLocationParamsToHash } from "../../LocationProvider/hooks/useGetLocationParamsToHash";
import { useMetadataContext } from "../../MetadataProvider/MetadataProvider";
import type { INotesContext } from "../../NotesProvider/NotesProvider";
import { type IDecoratedNote, NoteSource } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../../NotesProvider/types/StorageNote";
import type { ISingleNoteContext } from "./NoteContext";
import { NoteLayout } from "./NoteLayout";
import { NoteLink } from "./NoteLink";
import { NoteContainer } from "./SimpleComponents/NoteContainer";

export type NotesItem = {
  location: string;
  content: string;
};

type NoteProps = {
  ref?: RefObject<HTMLDivElement | null>;
  note: IDecoratedNote;
  sectionTitles: { sectionTitle: string; subSectionTitle: string };
  active: boolean;
  onEditNote(noteToReplace: IDecoratedNote, newNote: IStorageNote): void;
  onDeleteNote: INotesContext["handleDeleteNote"];
  onSelectNote: (note: IDecoratedNote, opts: { type: "currentVersion" | "originalVersion" | "close" }) => void;
};

export function Note({ ref, note, active = false, sectionTitles, onEditNote, onDeleteNote, onSelectNote }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const [noteDirty, setNoteDirty] = useState<IStorageNote>({
    ...note.original,
  });

  const [noteContentError, setNoteContentError] = useState("");
  const { metadata } = useMetadataContext();
  const { version } = useVersionContext();
  const { getHashFromLocationParams } = useGetLocationParamsToHash();
  const noteOriginalVersionShort = metadata.versions[note.original.version]?.name;
  const isEditable = note.source !== NoteSource.Remote;

  const handleSaveClick = useCallback(() => {
    const content = textAreaRef.current?.value ?? "";
    const mathValidationError = validateMath(content);
    setNoteContentError("");

    if (mathValidationError) {
      setNoteContentError(mathValidationError);
      return;
    }

    if (!content.trim()) {
      setNoteContentError("Note content cannot be empty");
      return;
    }

    noteDirty.content = content;

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

    onSelectNote(note, { type: "currentVersion" });
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

    onSelectNote(note, { type: "currentVersion" });
  };

  useEffect(() => {
    if (!active) {
      setIsEditing(false);
    }
  }, [active]);

  const onSelectNoteRef = useRef<NoteProps["onSelectNote"] | undefined>(undefined);
  onSelectNoteRef.current = onSelectNote;

  const memoizedOnSelectNote = useCallback(
    ({ type = "currentVersion" }: { type?: "currentVersion" | "originalVersion" | "close" } = {}) => {
      onSelectNoteRef.current?.(note, { type });
    },
    [note],
  );

  const currentVersionLink = useMemo(
    () =>
      getHashFromLocationParams({
        version: version,
        selectionStart: note.current.selectionStart,
        selectionEnd: note.current.selectionEnd,
      }),
    [version, note.current, getHashFromLocationParams],
  );

  const originalLink = useMemo(
    () =>
      getHashFromLocationParams({
        version: note.original.version,
        selectionStart: note.original.selectionStart,
        selectionEnd: note.original.selectionEnd,
      }),
    [note, getHashFromLocationParams],
  );

  const noteLayoutContext = useMemo(
    () =>
      ({
        active,
        note,
        isEditable,
        handleEditClick,
        handleSaveClick,
        handleCancelClick,
        onEditNote,
        isEditing,
        noteDirty,
        handleNoteLabelsChange,
        handleSelectNote: memoizedOnSelectNote,
        noteOriginalVersionShort,
        currentVersionLink,
        originalVersionLink: originalLink,
        sectionTitles,
      }) satisfies ISingleNoteContext,
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
      handleNoteLabelsChange,
      memoizedOnSelectNote,
      noteOriginalVersionShort,
      currentVersionLink,
      originalLink,
      sectionTitles,
    ],
  );

  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const mousePositionRef = useRef({ x: 0, y: 0 });

  const internalNoteRef = useRef<HTMLDivElement>(null);
  const noteRef = ref ? ref : internalNoteRef;

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDropdownOpen]);

  const handleIsDropdownOpen = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);

    if (!isOpen && noteRef.current) {
      const rect = noteRef.current.getBoundingClientRect();

      const isMouseInside =
        mousePositionRef.current.x >= rect.left &&
        mousePositionRef.current.x <= rect.right &&
        mousePositionRef.current.y >= rect.top &&
        mousePositionRef.current.y <= rect.bottom;

      setIsHovered(isMouseInside);

      // Check if focus is still within the note element
      const isFocusInside = noteRef.current.contains(document.activeElement);
      setIsFocused(isFocusInside);
    }
  };

  useEffect(() => {
    if (!active) {
      setIsHovered(false);
      setIsFocused(false);
      setIsDropdownOpen(false);
    }
  }, [active]);

  return (
    <NoteLayout.Root value={noteLayoutContext}>
      <NoteContainer
        ref={noteRef}
        active={active}
        data-testid="notes-manager-card"
        role={!active ? "button" : undefined}
        tabIndex={!active ? 0 : undefined}
        aria-label={!active ? "Activate label" : ""}
        onClick={handleWholeNoteClick}
        onKeyDown={handleNoteEnter}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isDropdownOpen) {
            setIsHovered(false);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          if (!isDropdownOpen) {
            setIsFocused(false);
          }
        }}
      >
        <div className="flex flex-col gap-2">
          {!active && (
            <>
              <NoteLink showTooltip={isHovered} />
              <NoteLayout.Text />
            </>
          )}
          {active && !isEditing && (
            <>
              <NoteLayout.SelectedText />
              <NoteLayout.Text />
              <NoteLayout.Labels />
            </>
          )}
          {active && isEditing && (
            <>
              <>
                <NoteLayout.SelectedText />
                <NoteLayout.TextArea className={noteContentError ? "error" : ""} ref={textAreaRef} />
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
        {(isHovered || isFocused || isDropdownOpen) && !isEditing && (
          <NoteLayout.Dropdown
            onDelete={handleDeleteClick}
            buttonClassName="absolute right-2 bottom-4 bg-inherit"
            onOpenChange={handleIsDropdownOpen}
          />
        )}
      </NoteContainer>
    </NoteLayout.Root>
  );
}
