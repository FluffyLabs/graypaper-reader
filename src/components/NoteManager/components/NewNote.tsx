import type { ISynctexBlockId } from "@fluffylabs/links-metadata";
import { Button } from "@fluffylabs/shared-ui";
import { type ChangeEvent, type ChangeEventHandler, useCallback, useMemo, useRef, useState } from "react";
import { useLatestCallback } from "../../../hooks/useLatestCallback";
import { validateMath } from "../../../utils/validateMath";
import { type IDecoratedNote, NoteSource } from "../../NotesProvider/types/DecoratedNote";
import type { INoteV3 } from "../../NotesProvider/types/StorageNote";
import type { ISingleNoteContext } from "./NoteContext";
import { NoteLayout } from "./NoteLayout";
import { NoteContainer } from "./SimpleComponents/NoteContainer";

type NewNoteProps = {
  version: string;
  onCancel: () => void;
  onSave: ({ noteContent, labels }: { noteContent: string; labels: string[] }) => void;
  selectionStart: ISynctexBlockId;
  selectionEnd: ISynctexBlockId;
};

export const NewNote = ({ version, onCancel, onSave, selectionStart, selectionEnd }: NewNoteProps) => {
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
    if (!noteContent.trim()) {
      setNoteContentError("Note content cannot be empty");
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

  const noteDirty = useDumbDirtyNoteObj({ noteContent, labels, version });
  const note = useDumbNoteObj({ version, selectionStart, selectionEnd });

  const noteLayoutContext = useNewNoteLayoutContext({
    note,
    noteDirty,
    currentVersionLink,
    handleCancelClick,
    handleNoteContentChange,
    handleNoteLabelsChange: setLabels,
    handleSaveClick,
    originalVersionLink,
    selectionStart,
    selectionEnd,
  });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelectionChange = () => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  return (
    <NoteLayout.Root value={noteLayoutContext}>
      <NoteContainer active={true}>
        <div className="flex flex-col gap-2">
          <NoteLayout.SelectedText onSelectionChanged={handleSelectionChange} />
          <NoteLayout.TextArea
            ref={textAreaRef}
            className={noteContentError ? "error" : ""}
            placeholder="Add your note for this section..."
          />
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

const createDumbISyntexBlockId = () =>
  ({
    index: 0,
    pageNumber: 0,
  }) satisfies ISynctexBlockId;

const useDumbNoteObj = ({
  version,
  selectionStart,
  selectionEnd,
}: { version: string; selectionStart: ISynctexBlockId; selectionEnd: ISynctexBlockId }) =>
  useMemo(
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
          date: 0,
          labels: [],
          noteVersion: 3,
          selectionEnd,
          selectionStart,
          version,
        },
        source: NoteSource.Local,
      }) satisfies IDecoratedNote,
    [version, selectionStart, selectionEnd],
  );

const useDumbDirtyNoteObj = ({
  noteContent,
  labels,
  version,
}: {
  noteContent: string;
  labels: string[];
  version: string;
}) =>
  useMemo(
    () =>
      ({
        author: "",
        content: noteContent,
        labels,
        date: 0,
        noteVersion: 3,
        selectionEnd: createDumbISyntexBlockId(),
        selectionStart: createDumbISyntexBlockId(),
        version,
      }) satisfies INoteV3,
    [noteContent, version, labels],
  );

const useNewNoteLayoutContext = ({
  handleSaveClick,
  handleCancelClick,
  note,
  noteDirty,
  handleNoteContentChange,
  handleNoteLabelsChange,
  currentVersionLink,
  originalVersionLink,
}: {
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  note: IDecoratedNote;
  noteDirty: INoteV3;
  handleNoteContentChange: ChangeEventHandler<HTMLTextAreaElement>;
  handleNoteLabelsChange: (labels: string[]) => void;
  currentVersionLink: string;
  originalVersionLink: string;
  selectionStart: ISynctexBlockId;
  selectionEnd: ISynctexBlockId;
}) =>
  useMemo(
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
        handleNoteLabelsChange,
        handleSelectNote: () => {},
        noteOriginalVersionShort: "",
        currentVersionLink,
        originalVersionLink,
      }) satisfies ISingleNoteContext,
    [
      noteDirty,
      handleNoteContentChange,
      handleNoteLabelsChange,
      note,
      handleCancelClick,
      handleSaveClick,
      currentVersionLink,
      originalVersionLink,
    ],
  );
