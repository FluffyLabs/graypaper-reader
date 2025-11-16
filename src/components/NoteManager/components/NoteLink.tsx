import { isSameBlock } from "@fluffylabs/links-metadata";
import { type MouseEventHandler, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import { CodeSyncContext, type ICodeSyncContext } from "../../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../../LocationProvider/LocationProvider";
import { useVersionContext } from "../../LocationProvider/VersionProvider";
import { useGetLocationParamsToHash } from "../../LocationProvider/hooks/useGetLocationParamsToHash";
import { type IDecoratedNote, NoteSource } from "../../NotesProvider/types/DecoratedNote";
import { OutlineLink } from "../../Outline";
import { type ISelectionContext, SelectionContext } from "../../SelectionProvider/SelectionProvider";
import { useNoteContext } from "./NoteContext";

type NoteLinkProps = {
  note: IDecoratedNote;
  active?: boolean;
};

export function NoteLink({ note, active = false }: NoteLinkProps) {
  const [sectionTitle, setTitle] = useState({
    section: "",
    subSection: "" as string | null,
  });

  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;

  const { version } = useVersionContext();
  const { getHashFromLocationParams } = useGetLocationParamsToHash();

  const migrationFlag = !note.current.isUpToDate;
  const isEditable = note.source !== NoteSource.Remote;

  const {
    selectionStart: { pageNumber },
  } = note.current;

  useEffect(() => {
    (async () => {
      const section = getSectionTitleAtSynctexBlock(note.current.selectionStart);
      const subSection = getSubsectionTitleAtSynctexBlock(note.current.selectionStart);

      setTitle({
        section: (await section) ?? "[no section]",
        subSection: await subSection,
      });
    })();
  }, [getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock, note]);

  const handleNoteLinkClick = useCallback<MouseEventHandler>((e) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    if (!href) return;
    window.location.hash = href;
  }, []);

  const currentVersionLink = useMemo(
    () =>
      getHashFromLocationParams({
        version: version,
        selectionStart: note.current.selectionStart,
        selectionEnd: note.current.selectionEnd,
      }),
    [version, note.current, getHashFromLocationParams],
  );

  const originalLink = useMemo(
    () =>
      getHashFromLocationParams({
        version: note.original.version,
        selectionStart: note.original.selectionStart,
        selectionEnd: note.original.selectionEnd,
      }),
    [note, getHashFromLocationParams],
  );

  const { section, subSection } = sectionTitle;
  return (
    <div className="note-link">
      {migrationFlag && (
        <a
          href={`#${originalLink}`}
          data-tooltip-id="note-link"
          data-tooltip-content="This note was created in a different version. Click here to see in original context."
          data-tooltip-place="top"
          className="icon default-link"
          onClick={handleNoteLinkClick}
        >
          ⚠
        </a>
      )}

      <OutlineLink
        href={`#${currentVersionLink}`}
        firstLevel
        title={subSection ? `${section} > ${subSection}` : section}
        number={`p. ${pageNumber} >`}
        onClick={handleNoteLinkClick}
      />

      {migrationFlag && isEditable && active && <UpdateVersionLink note={note} />}
      <Tooltip id="note-link" />
    </div>
  );
}

const UpdateVersionLink = ({ note }: { note: IDecoratedNote }) => {
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { onEditNote } = useNoteContext();
  const { version } = useVersionContext();
  const { selectedBlocks } = useContext(SelectionContext) as ISelectionContext;

  const handleMigrateClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();

      if (!locationParams.selectionStart || !locationParams.selectionEnd) return;

      if (
        (!isSameBlock(locationParams.selectionStart, note.current.selectionStart) ||
          !isSameBlock(locationParams.selectionEnd, note.current.selectionEnd)) &&
        !confirm("The selection has been altered. Are you sure you want to update the note?")
      ) {
        return;
      }

      onEditNote(note, {
        ...note.original,
        selectionStart: locationParams.selectionStart,
        selectionEnd: locationParams.selectionEnd,
        version,
      });
    },
    [version, locationParams, note, onEditNote],
  );

  return (
    <a
      href="#"
      onClick={handleMigrateClick}
      data-tooltip-id="note-link"
      data-tooltip-content="Make sure the selection is accurate or adjust it in the current version and update the note."
      data-tooltip-place="top"
      className={`default-link ${selectedBlocks.length === 0 ? "disabled update" : "update"}`}
    >
      (update version)
    </a>
  );
};
