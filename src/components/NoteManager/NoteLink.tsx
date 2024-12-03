import { type MouseEventHandler, useCallback, useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { blockIdsEqual } from "../../utils/blockIdsEqual";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import type { IHighlightNote, INotesContext } from "../NotesProvider/NotesProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

type NoteLinkProps = {
  note: IHighlightNote;
  version: string;
  onEditNote: INotesContext["handleUpdateNote"];
};

export function NoteLink({ note, version, onEditNote }: NoteLinkProps) {
  const [sectionTitle, setSectionTitle] = useState<string | null>("");
  const [subsectionTitle, setSubsectionTitle] = useState<string | null>("");
  const { selectedBlocks, setScrollToSelection } = useContext(SelectionContext) as ISelectionContext;
  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;
  const { setLocationParams, locationParams } = useContext(LocationContext) as ILocationContext;
  const { migrateSelection } = useContext(CodeSyncContext) as ICodeSyncContext;

  const migrationFlag = version !== note.version;

  useEffect(() => {
    getSectionTitleAtSynctexBlock(note.selectionStart).then((sectionTitleFromSource) =>
      setSectionTitle(sectionTitleFromSource),
    );
    getSubsectionTitleAtSynctexBlock(note.selectionStart).then((sectionTitleFromSource) =>
      setSubsectionTitle(sectionTitleFromSource),
    );
  }, [note, getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock]);

  const handleOriginalClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();

      setLocationParams({
        version: note.version,
        selectionStart: note.selectionStart,
        selectionEnd: note.selectionEnd,
      });
      setScrollToSelection(true);
    },
    [note, setLocationParams, setScrollToSelection],
  );

  const handleNoteTitleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();

      setScrollToSelection(true);
      setLocationParams({
        ...locationParams,
        selectionStart: note.selectionStart,
        selectionEnd: note.selectionEnd,
      });
    },
    [setScrollToSelection, note, locationParams, setLocationParams],
  );

  const handleAutoMigrateClick = useCallback<MouseEventHandler>(
    async (e) => {
      e.preventDefault();

      const newSelection = await migrateSelection(
        { selectionStart: note.selectionStart, selectionEnd: note.selectionEnd },
        note.version,
        version,
      );

      if (newSelection) {
        onEditNote(note, {
          ...note,
          selectionStart: newSelection.selectionStart,
          selectionEnd: newSelection.selectionEnd,
          version,
        });
      } else {
        alert("Migration failed. Please check the note's selection.");
      }
    },
    [migrateSelection, note, onEditNote, version],
  );

  const handleMigrateClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();

      if (!locationParams.selectionStart || !locationParams.selectionEnd) return;

      if (
        (!blockIdsEqual(locationParams.selectionStart, note.selectionStart) ||
          !blockIdsEqual(locationParams.selectionEnd, note.selectionEnd)) &&
        !confirm("Selection different than original. Are you sure you want to continue?")
      ) {
        return;
      }

      onEditNote(note, {
        ...note,
        selectionStart: locationParams.selectionStart,
        selectionEnd: locationParams.selectionEnd,
        version: locationParams.version,
        pageNumber: locationParams.selectionStart.pageNumber,
      });
    },
    [locationParams, note, onEditNote],
  );

  return (
    <div>
      {migrationFlag && (
        <a
          href={"#"}
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
        p. {note.pageNumber} &gt; {sectionTitle === null ? "[no section]" : sectionTitle}{" "}
        {subsectionTitle ? `> ${subsectionTitle}` : null}
      </a>
      {migrationFlag && (
        <>
          <a
            onClick={handleMigrateClick}
            data-tooltip-id="note-link"
            data-tooltip-content="Make sure the selection is accurate or adjust it in the current version and update the note."
            data-tooltip-place="top"
            className={selectedBlocks.length === 0 ? "disabled update" : "update"}
          >
            (migrate)
          </a>
          <a className="update" onClick={handleAutoMigrateClick}>
            (auto-migrate)
          </a>
        </>
      )}
      <Tooltip id="note-link" />
    </div>
  );
}
