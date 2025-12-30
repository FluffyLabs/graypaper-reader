import type { ISynctexBlockId } from "@fluffylabs/links-metadata";
import { Button } from "@fluffylabs/shared-ui";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLatestCallback } from "../../../hooks/useLatestCallback";
import { validateMath } from "../../../utils/validateMath";
import { CodeSyncContext, type ICodeSyncContext } from "../../CodeSyncProvider/CodeSyncProvider";
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
  const [noteContentError, setNoteContentError] = useState<string | null>(null);
  const [noteLabelsError, setNoteLabelsError] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>(["local"]);

  const latestOnCancel = useLatestCallback(onCancel);
  const latestOnSave = useLatestCallback(onSave);

  const handleLabelsChange = useCallback((nextLabels: string[]) => {
    setLabels(nextLabels);
    if (nextLabels.length > 0) {
      setNoteLabelsError(null);
    }
  }, []);

  const handleCancelClick = useCallback(() => {
    latestOnCancel.current();
  }, [latestOnCancel]);

  const handleSaveClick = useCallback(() => {
    const noteContent = textAreaRef.current?.value ?? "";
    setNoteContentError(null);
    setNoteLabelsError(null);

    const mathValidationError = validateMath(noteContent);
    if (mathValidationError) {
      setNoteContentError(mathValidationError);
      return;
    }
    if (!noteContent.trim()) {
      setNoteContentError("Note content cannot be empty");
      return;
    }
    if (labels.length === 0) {
      setNoteLabelsError("Select at least one label");
      return;
    }

    latestOnSave.current({ noteContent, labels });
  }, [latestOnSave, labels]);

  const currentVersionLink = "";
  const originalVersionLink = "";

  const noteDirty = useDumbDirtyNoteObj({ labels, version });
  const note = useDumbNoteObj({ version, selectionStart, selectionEnd });

  const noteLayoutContext = useNewNoteLayoutContext({
    note,
    noteDirty,
    currentVersionLink,
    handleCancelClick,
    handleNoteLabelsChange: handleLabelsChange,
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
          {noteLabelsError ? <div className="validation-message">{noteLabelsError}</div> : null}
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
  labels,
  version,
}: {
  labels: string[];
  version: string;
}) =>
  useMemo(
    () =>
      ({
        author: "",
        content: "",
        labels,
        date: 0,
        noteVersion: 3,
        selectionEnd: createDumbISyntexBlockId(),
        selectionStart: createDumbISyntexBlockId(),
        version,
      }) satisfies INoteV3,
    [version, labels],
  );

const useNewNoteLayoutContext = ({
  handleSaveClick,
  handleCancelClick,
  note,
  noteDirty,
  handleNoteLabelsChange,
  currentVersionLink,
  originalVersionLink,
  selectionEnd,
  selectionStart,
}: {
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  note: IDecoratedNote;
  noteDirty: INoteV3;
  handleNoteLabelsChange: (labels: string[]) => void;
  currentVersionLink: string;
  originalVersionLink: string;
  selectionStart: ISynctexBlockId;
  selectionEnd: ISynctexBlockId;
}) => {
  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;

  const [sectionTitles, setSectionTitles] = useState<{ sectionTitle: string; subSectionTitle: string }>({
    sectionTitle: "",
    subSectionTitle: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (selectionStart && selectionEnd) {
        const newSectionTitle = (await getSectionTitleAtSynctexBlock(selectionStart)) ?? "";
        const newSubSectionTitle = (await getSubsectionTitleAtSynctexBlock(selectionStart)) ?? "";
        if (cancelled) return;
        setSectionTitles({
          sectionTitle: newSectionTitle,
          subSectionTitle: newSubSectionTitle,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectionStart, selectionEnd, getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock]);

  const context = useMemo(
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
        handleNoteLabelsChange,
        handleSelectNote: () => {},
        noteOriginalVersionShort: "",
        currentVersionLink,
        originalVersionLink,
        sectionTitles,
      }) satisfies ISingleNoteContext,
    [
      noteDirty,
      handleNoteLabelsChange,
      note,
      handleCancelClick,
      handleSaveClick,
      currentVersionLink,
      originalVersionLink,
      sectionTitles,
    ],
  );

  return context;
};
