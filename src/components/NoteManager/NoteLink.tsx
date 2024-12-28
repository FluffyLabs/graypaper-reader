import { type MouseEventHandler, useCallback, useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { blockIdsEqual } from "../../utils/blockIdsEqual";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import type { INotesContext } from "../NotesProvider/NotesProvider";
import { type IDecoratedNote, NoteSource } from "../NotesProvider/types/DecoratedNote";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

type NoteLinkProps = {
  note: IDecoratedNote;
  onEditNote: INotesContext["handleUpdateNote"];
};

export function NoteLink({ note, onEditNote }: NoteLinkProps) {
  const [sectionTitle, setTitle] = useState({ section: "", subSection: "" as string | null });
  const { selectedBlocks, setScrollToSelection } = useContext(SelectionContext) as ISelectionContext;
  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;
  const { setLocationParams, locationParams } = useContext(LocationContext) as ILocationContext;

  const migrationFlag = note.canBeMigrated;
  const isEditable = note.source !== NoteSource.Remote;

  const { selectionStart, selectionEnd } = note;
  const { pageNumber } = selectionStart;

  useEffect(() => {
    (async () => {
      const section = getSectionTitleAtSynctexBlock(selectionStart);
      const subSection = getSubsectionTitleAtSynctexBlock(selectionStart);

      setTitle({
        section: (await section) ?? "[no section]",
        subSection: await subSection,
      });
    })();
  }, [selectionStart, getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock]);

  const handleNoteTitleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      setLocationParams({
        ...locationParams,
        selectionStart,
        selectionEnd,
      });
      setScrollToSelection(true);
    },
    [selectionStart, selectionEnd, locationParams, setLocationParams, setScrollToSelection],
  );

  const handleOriginalClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      setLocationParams({
        version: note.original.version,
        selectionStart: note.original.selectionStart,
        selectionEnd: note.original.selectionEnd,
      });
      setScrollToSelection(true);
    },
    [note, setLocationParams, setScrollToSelection],
  );

  const handleMigrateClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();

      if (!locationParams.selectionStart || !locationParams.selectionEnd) return;

      if (
        (!blockIdsEqual(locationParams.selectionStart, selectionStart) ||
          !blockIdsEqual(locationParams.selectionEnd, selectionEnd)) &&
        !confirm("The selection has been altered. Are you sure you want to update the note?")
      ) {
        return;
      }

      onEditNote(note, {
        ...note.original,
        selectionStart: locationParams.selectionStart,
        selectionEnd: locationParams.selectionEnd,
        version: locationParams.version,
      });
    },
    [locationParams, note, selectionStart, selectionEnd, onEditNote],
  );

  const { section, subSection } = sectionTitle;
  return (
    <div>
      {migrationFlag && (
        <a
          href="#"
          data-tooltip-id="note-link"
          data-tooltip-content="This note was created in a different version. Click here to see in original context."
          data-tooltip-place="top"
          className="icon"
          onClick={handleOriginalClick}
        >
          ⚠
        </a>
      )}

      <a href="#" onClick={handleNoteTitleClick}>
        p. {pageNumber} &gt; {section} {subSection ? `> ${subSection}` : null}
      </a>

      {migrationFlag && isEditable && (
        <a
          onClick={handleMigrateClick}
          data-tooltip-id="note-link"
          data-tooltip-content="Make sure the selection is accurate or adjust it in the current version and update the note."
          data-tooltip-place="top"
          className={selectedBlocks.length === 0 ? "disabled update" : "update"}
        >
          (update version)
        </a>
      )}
      <Tooltip id="note-link" />
    </div>
  );
}
