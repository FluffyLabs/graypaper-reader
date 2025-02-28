import { type EventHandler, Fragment, type KeyboardEvent, type MouseEvent, useMemo } from "react";
import "./Highlighter.css";
import type { ISynctexBlock } from "@fluffylabs/links-metadata";

const DEFAULT_HIGHLIGHT_OPACITY = 0.15;

// arbitrarily set offset to match the manual selection of text in presentation overlay.
const WIDTH_OFFSET = 5;
// aribtrarily set offset to make sure that the entirety of the letters is selected.
const HEIGHT_OFFSET = 5;

export interface IHighlighterColor {
  r: number;
  g: number;
  b: number;
}

interface IHighlighterProps {
  blocks: ISynctexBlock[];
  pageOffset: DOMRect;
  color: IHighlighterColor;
  onClick?: EventHandler<MouseEvent<unknown> | KeyboardEvent<unknown>>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  opacity?: number;
}

export function Highlighter({
  blocks,
  pageOffset,
  color,
  onClick,
  onMouseEnter,
  onMouseLeave,
  opacity = DEFAULT_HIGHLIGHT_OPACITY,
}: IHighlighterProps) {
  const nonOverlappingBlocks = useMemo(() => {
    const newBlocks = [];
    const blocksAndPositions = blocks.map((block) => ({ block, position: getBlockRect(pageOffset, block) }));
    for (const { block, position } of blocksAndPositions) {
      let isContainedWithinSomeOther = false;
      for (const other of blocksAndPositions) {
        // don't compare with self
        if (position === other.position) {
          continue;
        }
        // skip if the current block is not contained in other
        if (!isContainedWithin(position, other.position)) {
          continue;
        }
        // break early if we found we are inside another block
        isContainedWithinSomeOther = true;
        break;
      }
      if (!isContainedWithinSomeOther) {
        newBlocks.push(block);
      }
    }
    return newBlocks;
  }, [pageOffset, blocks]);

  const lowestBlock = nonOverlappingBlocks.reduce((a, b) => {
    return a.top > b.top ? a : b;
  });

  return nonOverlappingBlocks.map((block) => {
    const position = getBlockRect(pageOffset, block);
    const isLeftColumn = position.left + position.width < pageOffset.left + pageOffset.width / 2;

    const hasTrigger = onClick && block === lowestBlock;
    const blockStyles = {
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`,
    };

    return (
      <Fragment key={`${block.pageNumber},${block.index}`}>
        <div className="highlighter-highlight" style={blockStyles} />
        {hasTrigger && (
          <div
            className="highlighter-trigger"
            onClick={onClick}
            onKeyPress={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
              ...blockStyles,
              // move the trigger on top of the textLayer and highlight.
              zIndex: 3,
              left: `${isLeftColumn ? position.left - WIDTH_OFFSET : position.left + position.width - WIDTH_OFFSET}px`,
              top: `${position.top + position.height - HEIGHT_OFFSET}px`,
              width: "15px",
              backgroundColor: "initial",
              opacity: 0.4,
            }}
          >
            📍
          </div>
        )}
      </Fragment>
    );
  });
}

function getBlockRect(pageOffset: DOMRect, block: ISynctexBlock) {
  const top = pageOffset.top + pageOffset.height * block.top - pageOffset.height * block.height;
  const left = pageOffset.left + pageOffset.width * block.left;
  const width = pageOffset.width * block.width + WIDTH_OFFSET;
  const height = pageOffset.height * block.height + HEIGHT_OFFSET;

  return {
    top,
    left,
    width,
    height,
  };
}

type Position = ReturnType<typeof getBlockRect>;

function isContainedWithin(a: Position, b: Position) {
  const OVERLAP_OFFSET = 5;
  return (
    a.top >= b.top - OVERLAP_OFFSET &&
    a.left >= b.left - OVERLAP_OFFSET &&
    a.top + a.height <= b.top + b.height + OVERLAP_OFFSET &&
    a.left + a.width <= b.left + b.width + OVERLAP_OFFSET
  );
}
