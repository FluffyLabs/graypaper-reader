import { Badge } from "@fluffylabs/shared-ui";
import { type MouseEvent, useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { CodeSyncContext, type ICodeSyncContext } from "../../CodeSyncProvider/CodeSyncProvider";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";
import { OutlineLink } from "../../Outline";
import { useNoteContext } from "./NoteContext";

type NoteLinkProps = {
  note: IDecoratedNote;
  active?: boolean;
};

export function NoteLink({ note }: NoteLinkProps) {
  const [sectionTitle, setTitle] = useState({
    section: "",
    subSection: "" as string | null,
  });

  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;

  const { noteOriginalVersionShort, currentVersionLink, originalVersionLink, handleSelectNote } = useNoteContext();

  const migrationFlag = !note.current.isUpToDate;

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

  const handleMigrationLinkOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleSelectNote({ type: "originalVersion" });
  };

  const handleLinkOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleSelectNote();
  };

  const { section, subSection } = sectionTitle;
  return (
    <div className="note-link">
      {migrationFlag && (
        <a
          href={`#${originalVersionLink}`}
          data-tooltip-id="note-link"
          data-tooltip-content="This note was created in a different version. Click here to see in original context."
          data-tooltip-place="top"
          className="icon default-link"
          onClick={handleMigrationLinkOpen}
        >
          <Badge intent="destructive" className="px-1 py-0 text-xs">
            v{noteOriginalVersionShort}
          </Badge>
        </a>
      )}

      <OutlineLink
        href={`#${currentVersionLink}`}
        firstLevel
        title={subSection ? `${section} > ${subSection}` : section}
        number={`p. ${pageNumber} >`}
        onClick={handleLinkOpen}
      />

      <Tooltip id="note-link" />
    </div>
  );
}
