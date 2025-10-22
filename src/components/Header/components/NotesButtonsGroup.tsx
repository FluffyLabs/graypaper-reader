import { Button, ButtonGroup } from "@fluffylabs/shared-ui";
import { type FC, useContext } from "react";
import { Tooltip } from "react-tooltip";
import { LabelsFilter } from "../../LabelsFilter";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import { MoreButtonNotesActionsButton } from "./MoreNotesActionsButton";

export const NotesButtonsGroup: FC<{ className?: string }> = ({ className }) => {
  const { canUndo, canRedo, handleUndo, handleRedo, notesPinned, setNotesPinned } = useContext(
    NotesContext,
  ) as INotesContext;

  return (
    <>
      <ButtonGroup className={className}>
        <Button
          forcedColorScheme="dark"
          variant="tertiary"
          onClick={handleUndo}
          disabled={!canUndo}
          className="h-[32px]"
          data-tooltip-id="notes-button-tooltip"
          data-tooltip-content="Undo"
          data-tooltip-place="bottom"
          data-tooltip-delay-show={500}
        >
          ↺
        </Button>
        <Button
          forcedColorScheme="dark"
          variant="tertiary"
          onClick={handleRedo}
          disabled={!canRedo}
          className="h-[32px]"
          data-tooltip-id="notes-button-tooltip"
          data-tooltip-content="Redo"
          data-tooltip-place="bottom"
          data-tooltip-delay-show={500}
        >
          ↻
        </Button>
        <LabelsFilter forcedColorScheme="dark" />
        <Button
          forcedColorScheme="dark"
          variant="tertiary"
          onClick={() => setNotesPinned(!notesPinned)}
          className="h-[32px]"
          data-tooltip-id="notes-button-tooltip"
          data-tooltip-content={notesPinned ? "Unpin" : "Pin"}
          data-tooltip-place="bottom"
          data-tooltip-delay-show={500}
        >
          {notesPinned ? "📍" : "📌"}
        </Button>
        <MoreButtonNotesActionsButton />
      </ButtonGroup>
      <Tooltip
        id="notes-button-tooltip"
        style={{
          backgroundColor: "var(--sidebar-foreground-muted)",
          zIndex: 1,
          color: "var(--sidebar-foreground)",
          fontSize: "10px",
          opacity: 1,
        }}
      />
    </>
  );
};
