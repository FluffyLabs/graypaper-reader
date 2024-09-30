import "./Highlighter.css";
import type { ISynctexBlock } from "../CodeSyncProvider/CodeSyncProvider";

const DEFAULT_HIGHLIGHT_OPACITY = 0.2;

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
}

export function Highlighter({ blocks, pageOffset, color, opacity = DEFAULT_HIGHLIGHT_OPACITY }: IHighlighterProps) {
  return blocks.map((block) => (
    <div
      className="highlighter-highlight"
      style={{
        left: `${pageOffset.left + pageOffset.width * block.left}px`,
        top: `${pageOffset.top + pageOffset.height * block.top - pageOffset.height * block.height}px`,
        width: `${pageOffset.width * block.width + 5}px`,
        height: `${pageOffset.height * block.height + 5}px`,
        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`,
      }}
      key={`${block.pageNumber},${block.index}`}
    />
  ));
}
