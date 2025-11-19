import { type Input, Popover, PopoverContent, cn } from "@fluffylabs/shared-ui";
import { PopoverAnchor } from "@radix-ui/react-popover";
import { CircleX } from "lucide-react";
import { type ComponentProps, useContext, useMemo, useRef, useState } from "react";
import { Label } from "../../Label/Label";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import { prefixLabel } from "../../NotesProvider/hooks/useLabels";
import { useNoteContext } from "./NoteContext";
import { NoteSimpleInput, TinyIconButton } from "./SimpleComponents";

export function NoteLabels() {
  const { note, isEditing, noteDirty, handleNoteLabelsChange } = useNoteContext();

  const labels = isEditing ? noteDirty.labels : note.original.labels;

  return (
    <div className="labels items-start justify-start flex gap-x-1 gap-y-1 flex-wrap min-w-0">
      {labels.map((label) => (
        <Label
          key={label}
          label={prefixLabel(note.source, label)}
          variant="outlined"
          className="flex gap-1"
          endSlot={
            isEditing && (
              <TinyIconButton
                icon={<CircleX style={{ zoom: 0.5 }} />}
                aria-label="remove"
                className="p-0.5 h-4 relative top-0 hover:text-destructive"
                onClick={() => handleNoteLabelsChange([...noteDirty.labels.filter((l) => l !== label)])}
              />
            )
          }
        />
      ))}
      {isEditing && <NoteLabelsEdit />}
    </div>
  );
}

function NoteLabelsEdit() {
  const { noteDirty, handleNoteLabelsChange } = useNoteContext();
  const { labels } = useContext(NotesContext) as INotesContext;
  const [currentInput, setCurrentInput] = useState("");

  const visibleLabels = useMemo(
    () =>
      labels
        .filter((label) => label.prefixedLabel === "local")
        .flatMap((label) => label.children.map((child) => child.prefixedLabel))
        .filter((label) => !noteDirty.labels.some((dirtyLabel) => `local/${dirtyLabel}` === label))
        .filter((label) => label.toLocaleLowerCase().includes(currentInput.toLocaleLowerCase())),
    [currentInput, noteDirty.labels, labels],
  );

  const handleSelectLabel = (value: string) => {
    const isValid = value !== "";

    if (!isValid) {
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
    <NoteInputWithDropdown
      visibleLabels={visibleLabels}
      onSelectLabel={handleSelectLabel}
      onDoubleBackspace={handleBackspace}
      value={currentInput}
      onChange={(e) => setCurrentInput(e.currentTarget.value)}
    />
  );
}

type NoteInputProps = ComponentProps<typeof Input> & {
  onSelectLabel?: (value: string) => void;
  onDoubleBackspace?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  visibleLabels: string[];
};

const NoteInputWithDropdown = (props: NoteInputProps) => {
  const { onKeyDown, onSelectLabel, onDoubleBackspace, visibleLabels, className, ...restOfProps } = props;
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInBackspace, setIsInBackspace] = useState(false);
  const inBackspaceTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (open && visibleLabels[selectedIndex]) {
        handleItemSelect(visibleLabels[selectedIndex]);
        event.preventDefault();
      } else if (event.currentTarget.value.trim()) {
        onSelectLabel?.(event.currentTarget.value);
        event.currentTarget.value = "";
        restOfProps.onChange?.({ currentTarget: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
      }
    } else if (event.key === "Backspace") {
      if (isInBackspace) {
        onDoubleBackspace?.(event);
        clearTimeout(inBackspaceTimeoutRef.current);
        setIsInBackspace(false);
      } else if (inputRef.current?.value.length === 0) {
        setIsInBackspace(true);
        inBackspaceTimeoutRef.current = setTimeout(() => setIsInBackspace(false), 1500);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setSelectedIndex((prev) => (prev + 1) % visibleLabels.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (open) {
        setSelectedIndex((prev) => (prev - 1 + visibleLabels.length) % visibleLabels.length);
      }
    }

    onKeyDown?.(event);
  };

  const handleInputFocus = () => {
    setOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    restOfProps.onChange?.(e);
    setOpen(true);
    setSelectedIndex(0);
  };

  const handleItemSelect = (value: string) => {
    if (inputRef.current) {
      onSelectLabel?.(value.replace("local/", ""));
      inputRef.current.value = "";
      restOfProps.onChange?.({ currentTarget: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
      inputRef.current.focus();
    }
  };

  return (
    <Popover open={open && visibleLabels.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <NoteSimpleInput
          ref={inputRef}
          {...restOfProps}
          intent={isInBackspace ? "warning" : "neutral"}
          className={cn(
            "inline max-w-38 px-2 py-1 ml-[2px] mt-0.5 ring-0 text-xs",
            isInBackspace && "dark:placeholder:text-warning placeholder:text-warning-foreground",
            className,
          )}
          placeholder={isInBackspace ? "Backspace to remove" : "Add label"}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
      </PopoverAnchor>
      <PopoverContent
        className="min-w-[100px] max-w-[300px] w-auto p-0"
        align="end"
        sideOffset={5}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target === inputRef.current) {
            e.preventDefault();
          }
        }}
      >
        <div className="max-h-[200px] overflow-auto">
          {visibleLabels.map((item, index) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard events are indirectly handled via input;
            <div
              key={item}
              className={`px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => handleItemSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <Label label={item} variant="outlined" />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
