import { useCallback, useContext } from "react";
import { Tooltip } from "react-tooltip";
import { type INotesContext, NotesContext } from "../NotesProvider/NotesProvider";

export function PinNotesToggle() {
  const { notesPinned, setNotesPinned } = useContext(NotesContext) as INotesContext;

  const handleButtonClick = useCallback(() => {
    setNotesPinned(!notesPinned);
  }, [notesPinned, setNotesPinned]);

  return (
    <div>
      <button
        data-tooltip-id="notes"
        data-tooltip-content="Pin or unpin all notes"
        data-tooltip-place="right"
        onClick={handleButtonClick}
        className="default-button pin-notes-toggle"
      >
        {notesPinned ? "📍" : "📌"}
      </button>
      <Tooltip id="notes" />
    </div>
  );
}
