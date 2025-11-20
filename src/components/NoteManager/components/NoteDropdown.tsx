import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@fluffylabs/shared-ui";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useNoteContext } from "./NoteContext";
import { DropdownMenuItemCopyButton } from "./SimpleComponents/DropdownMenuItemCopyButton";
import { TwoStepDropdownMenuItem } from "./SimpleComponents/TwoStepDropdownMenuItem";

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

  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { setIsTracked: setTrackMousePosition, mousePositionRef } = useToggagleableMousePositionTracking(false);

  const handleCopyInitiated = () => {
    setTrackMousePosition(true);
  };

  const handleCopyComplete = () => {
    const isMouseOverButton =
      buttonRef.current && mousePositionRef.current
        ? isMouseOverElement(mousePositionRef.current, buttonRef.current)
        : false;
    const isMouseOverContent =
      contentRef.current && mousePositionRef.current
        ? isMouseOverElement(mousePositionRef.current, contentRef.current)
        : false;

    const shouldDropdownBeClosed = !isMouseOverButton && !isMouseOverContent;

    if (shouldDropdownBeClosed) {
      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);
    }
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={buttonRef}
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
            aria-hidden="true"
          >
            <circle cx="8" cy="3" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="13" r="1.5" fill="currentColor" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" ref={contentRef}>
        <DropdownMenuItem asChild>
          <a href={`#${currentVersionLink}`} onClick={handleOpenClose} className="flex justify-between items-center">
            <span>Open</span>
            <DropdownMenuItemCopyButton
              href={`/#${currentVersionLink}`}
              onCopyComplete={handleCopyComplete}
              onCopyInitiated={handleCopyInitiated}
            />
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
                <DropdownMenuItemCopyButton
                  href={`/#${originalVersionLink}`}
                  onCopyComplete={handleCopyComplete}
                  onCopyInitiated={handleCopyInitiated}
                />
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

const useToggagleableMousePositionTracking = (initialIsTracked: boolean) => {
  const [isTracked, setIsTracked] = useState(initialIsTracked);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isTracked) {
    }

    document.addEventListener("mousemove", (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    });

    return () => {
      document.removeEventListener("mousemove", () => {});
    };
  }, [isTracked]);

  return { isTracked, setIsTracked, mousePositionRef };
};

const isMouseOverElement = (mousePos: { x: number; y: number }, element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return mousePos.x >= rect.left && mousePos.x <= rect.right && mousePos.y >= rect.top && mousePos.y <= rect.bottom;
};
