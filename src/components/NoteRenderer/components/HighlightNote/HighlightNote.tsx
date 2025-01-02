import "./HighlightNote.css";
import { useContext, useMemo, useState } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../../../CodeSyncProvider/CodeSyncProvider";
import { Highlighter } from "../../../Highlighter/Highlighter";
import type { IDecoratedNote } from "../../../NotesProvider/types/DecoratedNote";
import { RenderNote } from "../../../RenderNote/RenderNote";

interface HighlightNoteProps {
  note: IDecoratedNote;
  pageOffset: DOMRect;
}

const NOTE_COLOR = { r: 200, g: 200, b: 0 };
const NOTE_OPACITY = 0.5;

export function HighlightNote({ note, pageOffset }: HighlightNoteProps) {
  const [noteContentHeight, setNoteContentHeight] = useState<number>(0);
  const { getSynctexBlockRange } = useContext(CodeSyncContext) as ICodeSyncContext;
  const [noteIsShown, setNoteIsShown] = useState(true);

  const { selectionStart, selectionEnd } = note.current;

  const blocks = useMemo(
    () => getSynctexBlockRange(selectionStart, selectionEnd),
    [selectionStart, selectionEnd, getSynctexBlockRange],
  );

  if (!blocks.length) return null;

  const rightmostEdge = Math.max(...blocks.map(({ left, width }) => left + width));
  const leftmostEdge = Math.min(...blocks.map(({ left }) => left));

  const position =
    rightmostEdge > 0.5
      ? {
          left: `${pageOffset.left + rightmostEdge * pageOffset.width}px`,
          top: `${pageOffset.top + pageOffset.height * blocks[blocks.length - 1].top - noteContentHeight}px`,
        }
      : {
          right: `${pageOffset.right - pageOffset.width + (1 - leftmostEdge) * pageOffset.width}px`,
          top: `${pageOffset.top + pageOffset.height * blocks[blocks.length - 1].top - noteContentHeight}px`,
        };

  const style = {
    opacity: noteIsShown ? 1.0 : 0.1,
    ...position,
  };

  const handleNoteContentRef = (noteContentElement: HTMLDivElement) =>
    setNoteContentHeight(noteContentElement?.offsetHeight || 0);

  return (
    <>
      <Highlighter blocks={blocks} pageOffset={pageOffset} color={NOTE_COLOR} opacity={NOTE_OPACITY} />

      <div
        className="highlight-note-content"
        ref={handleNoteContentRef}
        style={style}
        onMouseEnter={() => setNoteIsShown(false)}
        onMouseLeave={() => setNoteIsShown(true)}
      >
        <RenderNote content={note.original.content} />
      </div>
    </>
  );
}
