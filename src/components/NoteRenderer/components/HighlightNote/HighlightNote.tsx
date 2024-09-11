import "./HighlightNote.css";
import { useState } from "react";
import { Highlighter } from "../../../Highlighter/Highlighter";
import type { IHighlightNote } from "../../../NotesProvider/NotesProvider";

interface HighlightNoteProps {
  note: IHighlightNote;
  pageOffset: DOMRect;
}

export function HighlightNote({ note, pageOffset }: HighlightNoteProps) {
  const [noteContentHeight, setNoteContentHeight] = useState<number>(0);
  const rightmostEdge = Math.max(...note.blocks.map(({ left, width }) => left + width));

  const handleNoteContentRef = (noteContentElement: HTMLDivElement) =>
    setNoteContentHeight(noteContentElement?.offsetHeight || 0);

  return (
    <>
      <Highlighter blocks={note.blocks} pageOffset={pageOffset} />

      <div
        className="highlight-note-content"
        ref={handleNoteContentRef}
        style={{
          left: `${pageOffset.left + rightmostEdge * pageOffset.width}px`,
          top: `${pageOffset.top + pageOffset.height * note.blocks[note.blocks.length - 1].top - noteContentHeight}px`,
        }}
      >
        {note.content}
      </div>
    </>
  );
}
