import type { Textarea } from "@fluffylabs/shared-ui";
import { type ComponentProps, useContext, useEffect, useId } from "react";
import { usePrevious } from "../../../hooks/usePrevious";
import { NoteContent } from "../../NoteContent/NoteContent";
import { type ISelectionContext, SelectionContext } from "../../SelectionProvider/SelectionProvider";
import { noteContext, useNoteContext } from "./NoteContext";
import { NoteDropdown } from "./NoteDropdown";
import { NoteLabels } from "./NoteLabels";
import { NoteLink } from "./NoteLink";
import { NoteSimpleTextarea } from "./SimpleComponents";

export const NoteText = () => {
  const { note } = useNoteContext();

  return (
    <blockquote className="whitespace-pre-wrap">
      {note.original.author}
      <NoteContent content={note.original.content} />
    </blockquote>
  );
};

export const SelectedText = ({ onSelectionChanged }: { onSelectionChanged?: () => void }) => {
  const { selectionString } = useContext(SelectionContext) as ISelectionContext;
  const prevSelectionString = usePrevious(selectionString);

  useEffect(() => {
    if (prevSelectionString !== selectionString) {
      onSelectionChanged?.();
    }
  }, [prevSelectionString, selectionString, onSelectionChanged]);

  const id = useId();
  console.log("Note text", id);

  return (
    <div className="px-6 py-3 bg-sidebar rounded-md border-brand-primary border flex flex-col gap-1">
      <div className="flex justify-between gap-1">
        <NoteLink />
      </div>
      <blockquote className="italic max-h-68 overflow-y-auto" data-testid="selected-text">
        {selectionString}
      </blockquote>
    </div>
  );
};

export const NoteTextArea = (props: ComponentProps<typeof Textarea>) => {
  const { handleSaveClick, handleCancelClick, noteDirty } = useNoteContext();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey === true || event.metaKey === true)) {
      event.preventDefault();
      handleSaveClick();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      handleCancelClick();
    }
  };

  return <NoteSimpleTextarea {...props} autoFocus onKeyDown={handleKeyDown} defaultValue={noteDirty.content} />;
};

export const NoteLayout = {
  Root: noteContext.Provider,
  Text: NoteText,
  TextArea: NoteTextArea,
  SelectedText: SelectedText,
  Labels: NoteLabels,
  Dropdown: NoteDropdown,
};
