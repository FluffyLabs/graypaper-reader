import type { ISynctexBlockId } from "@fluffylabs/links-metadata";
import { Button } from "@fluffylabs/shared-ui";
import { type ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { useLatestCallback } from "../../../hooks/useLatestCallback";
import { validateMath } from "../../../utils/validateMath";
import { type IDecoratedNote, NoteSource } from "../../NotesProvider/types/DecoratedNote";
import type { INoteV3 } from "../../NotesProvider/types/StorageNote";
import type { ISingleNoteContext } from "./NoteContext";
import { NoteLayout } from "./NoteLayout";
import { NoteContainer } from "./SimpleComponents/NoteContainer";

type NewNoteProps = {
  selectionStart: ISynctexBlockId;
  selectionEnd: ISynctexBlockId;
  version: string;
  onCancel: () => void;
  onSave: ({ noteContent, labels }: { noteContent: string; labels: string[] }) => void;
};

export const NewNote = ({ selectionEnd, selectionStart, version, onCancel, onSave }: NewNoteProps) => {
  const dateRef = useRef(new Date().getTime());

  const [noteContent, setNoteContent] = useState("");
  const [noteContentError, setNoteContentError] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>(["local"]);

  const latestOnCancel = useLatestCallback(onCancel);
  const latestOnSave = useLatestCallback(onSave);

  const handleCancelClick = useCallback(() => {
    latestOnCancel.current();
  }, [latestOnCancel]);

  const handleSaveClick = useCallback(() => {
    const mathValidationError = validateMath(noteContent);
    if (mathValidationError) {
      setNoteContentError(mathValidationError);
      return;
    }

    latestOnSave.current({ noteContent, labels });
  }, [noteContent, latestOnSave, labels]);

  const currentVersionLink = "";
  const originalVersionLink = "";

  const handleNoteContentChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(event.target.value);
    setNoteContentError(null);
  }, []);

  const noteDirty = useMemo(
    () =>
      ({
        author: "",
        content: noteContent,
        labels,
        date: dateRef.current,
        noteVersion: 3,
        selectionEnd,
        selectionStart,
        version,
      }) satisfies INoteV3,
    [noteContent, version, selectionStart, selectionEnd, labels],
  );

  const note = useMemo(
    () =>
      ({
        current: {
          isMigrated: true,
          isUpToDate: true,
          selectionEnd,
          selectionStart,
          version,
        },
        key: "newNote",
        original: {
          author: "",
          content: "",
          date: dateRef.current,
          labels: [],
          noteVersion: 3,
          selectionEnd,
          selectionStart,
          version,
        },
        source: NoteSource.Local,
      }) satisfies IDecoratedNote,
    [selectionEnd, selectionStart, version],
  );

  const noteLayoutContext = useMemo(
    () =>
      ({
        active: true,
        isEditable: true,
        handleEditClick: () => {},
        handleSaveClick,
        handleCancelClick,
        onEditNote: () => {},
        isEditing: true,
        note,
        noteDirty,
        handleNoteContentChange,
        handleNoteLabelsChange: setLabels,
        handleSelectNote: () => {},
        noteOriginalVersionShort: "",
        currentVersionLink,
        originalVersionLink,
      }) satisfies ISingleNoteContext,
    [noteDirty, handleNoteContentChange, note, handleCancelClick, handleSaveClick],
  );

  return (
    <NoteLayout.Root value={noteLayoutContext}>
      <NoteContainer active={true}>
        <div className="flex flex-col gap-2">
          <NoteLayout.SelectedText />
          <NoteLayout.TextArea className={noteContentError ? "error" : ""} />
          {noteContentError ? <div className="validation-message">{noteContentError}</div> : null}
          <NoteLayout.Labels />
          <div className="actions gap-2">
            <div className="fill" />
            <Button variant="tertiary" data-testid={"cancel-button"} onClick={handleCancelClick} size="sm">
              Cancel
            </Button>
            <Button data-testid={"save-button"} onClick={handleSaveClick} size="sm">
              Save
            </Button>
          </div>
        </div>
      </NoteContainer>
    </NoteLayout.Root>
  );
};
