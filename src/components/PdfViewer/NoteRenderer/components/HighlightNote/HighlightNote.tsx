import "./HighlightNote.css";
import { Fragment, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../../../../CodeSyncProvider/CodeSyncProvider";
import { NoteContent } from "../../../../NoteContent/NoteContent";
import { NoteLabels } from "../../../../NoteManager/components/NoteLabels";
import type { IDecoratedNote } from "../../../../NotesProvider/types/DecoratedNote";
import { Highlighter } from "../../../Highlighter/Highlighter";

interface HighlightNoteProps {
  notes: IDecoratedNote[];
  pageOffset?: DOMRect;
  isPinnedByDefault: boolean;
  isInViewport: boolean;
}

const NOTE_COLOR = { r: 200, g: 200, b: 0 };
const NOTE_OPACITY = 0.3;
const HOVER_OFF_DELAY_MS = 350;

export function HighlightNote({ notes, pageOffset, isInViewport, isPinnedByDefault }: HighlightNoteProps) {
  const [noteContentHeight, setNoteContentHeight] = useState<number>(0);
  const { getSynctexBlockRange } = useContext(CodeSyncContext) as ICodeSyncContext;
  // by default the note state is controlled by `isPinnedByDefault`, but the user might change that.
  const [isPinned, setPinned] = useState<boolean | null>(null);
  // when note is not displayed, it may be temporarily by hovering the annotation
  const [isHovered, setHovered] = useState(false);

  // state of the note content display
  const isDisplayed = isPinned ?? isPinnedByDefault;
  const { selectionStart, selectionEnd } = notes[0].current;

  const blocks = useMemo(
    () => getSynctexBlockRange(selectionStart, selectionEnd),
    [selectionStart, selectionEnd, getSynctexBlockRange],
  );

  // delay hovering a bit
  const setHoveredTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setHoveredLater = useCallback((val: boolean) => {
    clearTimeout(setHoveredTimeout.current);
    if (val) {
      setHovered(true);
    } else {
      // we delay only hover off
      setHoveredTimeout.current = setTimeout(() => {
        setHovered(false);
      }, HOVER_OFF_DELAY_MS);
    }
  }, []);
  const handleNoteHoverOn = useCallback(() => setHoveredLater(true), [setHoveredLater]);
  const handleNoteHoverOff = useCallback(() => setHoveredLater(false), [setHoveredLater]);
  const handleNotePinnedToggle = useCallback(() => setPinned((x) => !x), []);

  // do not render anything if we don't have selection, pageOffsets are not loaded yet
  // or the note is inactive because it's on some other page.
  if (!blocks.length || !pageOffset || !isInViewport) {
    return null;
  }

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
    display: isDisplayed || isHovered ? "block" : "none",
    ...position,
  };

  const handleNoteContentRef = (noteContentElement: HTMLDivElement) =>
    setNoteContentHeight(noteContentElement?.offsetHeight || 0);

  // TODO [ToDr] Highlighting should be split out from this code.
  // We might have multiple notes that have different selections,
  // but there is some overlap. Currently we display two highlights
  // on top of each other, which makes it impossible to click both.
  // We should rather display one highlight and have it open both notes,
  // or be able to select which note to open.
  return (
    <>
      <Highlighter
        blocks={blocks}
        pageOffset={pageOffset}
        color={NOTE_COLOR}
        opacity={NOTE_OPACITY}
        onClick={handleNotePinnedToggle}
        onMouseEnter={handleNoteHoverOn}
        onMouseLeave={handleNoteHoverOff}
      />

      <div
        className="highlight-note-content"
        ref={handleNoteContentRef}
        style={style}
        onMouseEnter={handleNoteHoverOn}
        onMouseLeave={handleNoteHoverOff}
      >
        <a className="close default-link" onClick={handleNotePinnedToggle}>
          {isDisplayed ? "📍" : "📌"}
        </a>
        {notes.map((note) => (
          <Fragment key={note.key}>
            {/*<NoteLabels note={note} />*/}
            {note.original.author}
            <NoteContent content={note.original.content} />
            <br />
          </Fragment>
        ))}
      </div>
    </>
  );
}
