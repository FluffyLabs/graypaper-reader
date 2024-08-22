import "./HighlightNote.css";
import { useState } from "react";
import type { ISynctexBlock } from "../../../CodeSyncProvider/CodeSyncProvider";
import type { IHighlightNote, IPageOffset } from "../../NoteRenderer";

interface HighlightNoteProps {
  note: IHighlightNote;
  coordinates: ISynctexBlock[];
  pageOffset: IPageOffset;
}

export function HighlightNote({ note, coordinates, pageOffset }: HighlightNoteProps) {
  const [noteContentHeight, setNoteContentHeight] = useState<number>(0);
  const rightmostEdge = Math.max(...coordinates.map(({ left, width }) => left + width));

  const handleNoteContentRef = (noteContentElement: HTMLDivElement) =>
    setNoteContentHeight(noteContentElement?.offsetHeight || 0);

  return (
    <>
      {coordinates.map((marker) => (
        <div
          className="highlight-note-highlight"
          style={{
            left: `${pageOffset.left + pageOffset.width * marker.left}px`,
            top: `${pageOffset.top + pageOffset.height * marker.top - pageOffset.height * marker.height}px`,
            width: `${pageOffset.width * marker.width}px`,
            height: `${pageOffset.height * marker.height}px`,
          }}
          key={`${marker.left},${marker.top}`}
        />
      ))}

      <div
        className="highlight-note-content"
        ref={handleNoteContentRef}
        style={{
          left: `${pageOffset.left + rightmostEdge * pageOffset.width}px`,
          top: `${pageOffset.top + pageOffset.height * coordinates[coordinates.length - 1].top - noteContentHeight}px`,
        }}
      >
        {note.content}
      </div>
    </>
  );
}
