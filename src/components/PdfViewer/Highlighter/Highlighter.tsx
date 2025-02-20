import type { EventHandler, KeyboardEvent, MouseEvent } from "react";
import "./Highlighter.css";
import type { ISynctexBlock } from "@fluffylabs/links-metadata";

const DEFAULT_HIGHLIGHT_OPACITY = 0.2;

// arbitrarily set offset to match the manual selection of text in presentation overlay.
const WIDTH_OFFSET = 5;
// aribtrarily set offset to make sure that the entirety of the letters is selected.
const HEIGHT_OFFSET = 5;

// We control the z-index manually, for two reasons:
// 1. selection highlight to be below the annotation/note highlight.
// 2. notes/tooltips to be on top of the annotations (see `HighlightNote.css`)
// 3. multiple notes annotations should be reversly ordered
const DEFAULT_ZINDEX = 3;

export interface IHighlighterColor {
  r: number;
  g: number;
  b: number;
}

interface IHighlighterProps {
  blocks: ISynctexBlock[];
  pageOffset: DOMRect;
  color: IHighlighterColor;
  opacity?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: EventHandler<MouseEvent<unknown> | KeyboardEvent<unknown>>;
  zIndex?: number;
}

export function Highlighter({
  blocks,
  pageOffset,
  color,
  onClick,
  onMouseEnter,
  onMouseLeave,
  opacity = DEFAULT_HIGHLIGHT_OPACITY,
  zIndex = DEFAULT_ZINDEX,
}: IHighlighterProps) {
  return blocks.map((block) => (
    <div
      className="highlighter-highlight"
      onClick={onClick}
      onKeyPress={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        // move active highlights on top, so they can be closed
        zIndex,
        left: `${pageOffset.left + pageOffset.width * block.left}px`,
        top: `${pageOffset.top + pageOffset.height * block.top - pageOffset.height * block.height}px`,
        width: `${pageOffset.width * block.width + WIDTH_OFFSET}px`,
        height: `${pageOffset.height * block.height + HEIGHT_OFFSET}px`,
        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`,
      }}
      key={`${block.pageNumber},${block.index}`}
    />
  ));
}
