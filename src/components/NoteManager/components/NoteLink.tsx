import { Badge } from "@fluffylabs/shared-ui";
import type { MouseEvent } from "react";
import { OutlineLink } from "../../Outline";
import { useNoteContext } from "./NoteContext";

export function NoteLink() {
  const { note, sectionTitles, noteOriginalVersionShort, currentVersionLink, originalVersionLink, handleSelectNote } =
    useNoteContext();

  const migrationFlag = !note.current.isUpToDate;

  const {
    selectionStart: { pageNumber },
  } = note.current;

  const handleMigrationLinkOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleSelectNote({ type: "originalVersion" });
  };

  const handleLinkOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleSelectNote();
  };

  const { sectionTitle, subSectionTitle } = sectionTitles;

  // const id = useId();
  // console.log("NoteLink", id);

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
        title={subSectionTitle ? `${sectionTitle} > ${subSectionTitle}` : sectionTitle ?? ""}
        number={`p. ${pageNumber} >`}
        onClick={handleLinkOpen}
      />
    </div>
  );
}
