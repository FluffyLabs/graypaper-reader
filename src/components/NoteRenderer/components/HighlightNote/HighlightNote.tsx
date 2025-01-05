import "./HighlightNote.css";
import { Fragment, type MouseEventHandler, useCallback, useContext, useMemo, useState } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../../../CodeSyncProvider/CodeSyncProvider";
import { Highlighter } from "../../../Highlighter/Highlighter";
import type { IDecoratedNote } from "../../../NotesProvider/types/DecoratedNote";
import { RenderNote } from "../../../RenderNote/RenderNote";

interface HighlightNoteProps {
  notes: IDecoratedNote[];
  pageOffset?: DOMRect;
  isVisible: boolean;
}

const NOTE_COLOR = { r: 200, g: 200, b: 0 };
const NOTE_OPACITY = 0.5;

export function HighlightNote({ notes, pageOffset, isVisible }: HighlightNoteProps) {
  const [noteContentHeight, setNoteContentHeight] = useState<number>(0);
  const { getSynctexBlockRange } = useContext(CodeSyncContext) as ICodeSyncContext;
  const [noteTranslucent, setNoteTranslucent] = useState(false);
  const [noteDisplayed, setNoteDisplayed] = useState(true);

  const { selectionStart, selectionEnd } = notes[0].current;

  const blocks = useMemo(
    () => getSynctexBlockRange(selectionStart, selectionEnd),
    [selectionStart, selectionEnd, getSynctexBlockRange],
  );

  if (!blocks.length || !pageOffset) return null;

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
    display: noteDisplayed ? "block" : "none",
    opacity: noteTranslucent ? 0.1 : 1.0,
    ...position,
  };

  const handleNoteContentRef = (noteContentElement: HTMLDivElement) =>
    setNoteContentHeight(noteContentElement?.offsetHeight || 0);

  const noteTranslucentToggle = useCallback(() => setNoteTranslucent((noteIsShown) => !noteIsShown), []);
  const noteToggle = useCallback<MouseEventHandler>((e) => {
    // stop propagation to avoid changing the translucens as well.
    e.stopPropagation();
    e.preventDefault();
    setNoteDisplayed((x) => !x);
  }, []);

  if (!isVisible) {
    return null;
  }

  // TODO [ToDr] Highlighting should be split out from this code.
  // We might have multiple notes that have different selections,
  // but there is some overlap. Currently we display two highlights
  // on top of each other, which makes it impossible to click both.
  // We should rather display one highlight and have it open both notes,
  // or be able to select which note to open.
  return (
    <div>
      <Highlighter
        blocks={blocks}
        pageOffset={pageOffset}
        color={NOTE_COLOR}
        opacity={NOTE_OPACITY}
        isActive={noteDisplayed}
        onClick={noteToggle}
      />

      <div
        className="highlight-note-content"
        ref={handleNoteContentRef}
        style={style}
        onClick={noteTranslucentToggle}
        onKeyPress={noteTranslucentToggle}
      >
        <a className="close" onClick={noteToggle}>
          X
        </a>
        {notes.map((note) => (
          <Fragment key={note.key}>
            {note.original.author}
            <RenderNote content={note.original.content} />
            <br />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
