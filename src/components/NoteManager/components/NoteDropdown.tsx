import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@fluffylabs/shared-ui";
import {
  type MouseEvent,
  type MouseEventHandler,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useNoteContext } from "./NoteContext";
import { DropdownMenuItemCopyButton } from "./SimpleComponents/DropdownMenuItemCopyButton";

export const NoteDropdown = ({
  buttonClassName,
  onDelete,
  onOpenChange,
}: { buttonClassName?: string; onDelete?: () => void; onOpenChange?: (open: boolean) => void }) => {
  const {
    active,
    handleSelectNote,
    noteOriginalVersionShort,
    note,
    handleEditClick,
    currentVersionLink,
    isEditable,
    originalVersionLink,
  } = useNoteContext();

  const handleOpenClose = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    handleSelectNote({ type: active ? "close" : "currentVersion" });
  };

  const openInDifferentVersion = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    handleSelectNote({ type: "originalVersion" });
  };

  const removeNote = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDelete?.();
  };

  const editNode = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!active) {
      handleSelectNote();
    }
    handleEditClick();
  };

  const handleCopyComplete = () => {
    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      bubbles: true,
    });
    document.dispatchEvent(escapeEvent);
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          intent="neutralMedium"
          className={cn("p-2 h-6", buttonClassName)}
          data-testid={"dropdown-button"}
          aria-label="dropdown button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="dropdown button"
          >
            <circle cx="8" cy="3" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="13" r="1.5" fill="currentColor" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem asChild>
          <a href={`#${currentVersionLink}`} onClick={handleOpenClose} className="flex justify-between items-center">
            <span>Open</span>
            <DropdownMenuItemCopyButton href={`/#${currentVersionLink}`} onCopyComplete={handleCopyComplete} />
          </a>
        </DropdownMenuItem>
        {!note.current.isUpToDate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={`#${originalVersionLink}`}
                onClick={openInDifferentVersion}
                className="flex justify-between items-center"
              >
                <span>Open in v{noteOriginalVersionShort}</span>
                <DropdownMenuItemCopyButton href={`/#${originalVersionLink}`} onCopyComplete={handleCopyComplete} />
              </a>
            </DropdownMenuItem>
          </>
        )}
        {isEditable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={editNode} data-testid="edit-note-button">
              <span>Edit note</span>
            </DropdownMenuItem>
            <TwoStepDropdownMenuItem onClick={removeNote} confirmationSlot={<span>Are you sure?</span>}>
              <span>Remove note</span>
            </TwoStepDropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TwoStepDropdownMenuItem = ({
  children,
  confirmationSlot,
  onClick,
}: PropsWithChildren<{ confirmationSlot: ReactNode; onClick: MouseEventHandler<HTMLDivElement> }>) => {
  const [isConfirmation, setIsConfirmation] = useState(false);

  useEffect(() => {
    if (!isConfirmation) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setIsConfirmation(false);
    }, 2000);

    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [isConfirmation]);

  const handleOnClick: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isConfirmation) {
      e.preventDefault();
      e.stopPropagation();
      setIsConfirmation(true);
    } else {
      onClick(e);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleOnClick}
      className={cn(isConfirmation ? "text-destructive hover:bg-destructive/20 hover:text-destructive" : "")}
    >
      {!isConfirmation && children}
      {isConfirmation && confirmationSlot}
    </DropdownMenuItem>
  );
};
