import type { Input } from "@fluffylabs/shared-ui";
import { CircleX } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Label } from "../../Label/Label";
import { prefixLabel } from "../../NotesProvider/hooks/useLabels";
import { useNoteContext } from "./NoteContext";
import { NoteSimpleInput, TinyIconButton } from "./SiimpleComponents";

export function NoteLabels() {
  const { note, isEditing, noteDirty, handleNoteLabelsChange } = useNoteContext();

  const labels = isEditing ? noteDirty.labels : note.original.labels;

  return (
    <div className="labels items-start justify-start flex gap-x-1 gap-y-1 flex-wrap">
      {labels.map((label) => (
        <Label
          key={label}
          label={prefixLabel(note.source, label)}
          variant="outlined"
          className="flex gap-1"
          endSlot={
            isEditing && (
              <TinyIconButton
                icon={
                  <CircleX
                    style={{ zoom: 0.5 }}
                    onClick={() => handleNoteLabelsChange([...noteDirty.labels.filter((l) => l !== label)])}
                  />
                }
                aria-label="remove"
                className="p-0.5 h-4 relative top-0.5 hover:text-destructive"
              />
            )
          }
        />
      ))}
      {isEditing && <NoteLabelsEdit />}
    </div>
  );
}

export function NoteLabelsEdit() {
  const { noteDirty, handleNoteLabelsChange } = useNoteContext();
  const [currentInput, setCurrentInput] = useState("");

  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value.trim();
    const isValid = value !== "";

    if (!isValid) {
      //TODO: do something when input is invalid
      return;
    }

    if (value) {
      const newUniqueLabels = new Set(noteDirty.labels);
      newUniqueLabels.add(value);
      handleNoteLabelsChange(Array.from(newUniqueLabels));
      setCurrentInput("");
    }
  };

  const handleBackspace = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.currentTarget.value !== "") {
      return;
    }

    const withRemovedLastItem = noteDirty.labels.slice(0, -1);
    handleNoteLabelsChange(withRemovedLastItem);
    requestAnimationFrame(() => {
      setCurrentInput(noteDirty.labels.at(-1) || "");
    });
  };

  return (
    <NoteInput
      onEnter={handleEnter}
      onBackspace={handleBackspace}
      className="inline max-w-24 px-2 py-1 ml-[2px] mt-0.5 ring-0 text-xs"
      placeholder="Add label"
      value={currentInput}
      onChange={(e) => setCurrentInput(e.currentTarget.value)}
    />
  );
}

type NoteInputProps = ComponentProps<typeof Input> & {
  onEnter?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBackspace?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const NoteInput = (props: NoteInputProps) => {
  const { onKeyDown, onEnter, onBackspace, ...restOfProps } = props;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onEnter?.(event);
    } else if (event.key === "Backspace") {
      onBackspace?.(event);
    }

    onKeyDown?.(event);
  };

  return <NoteSimpleInput {...restOfProps} onKeyDown={handleKeyDown} />;
};
