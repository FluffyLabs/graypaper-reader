import { type ISynctexBlock, isSameBlock } from "@fluffylabs/links-metadata";
import { useContext, useEffect, useState } from "react";
import { subtractBorder } from "../../../utils/subtractBorder";
import { type IPdfContext, PdfContext } from "../../PdfProvider/PdfProvider";
import { type ISelectionContext, SelectionContext } from "../../SelectionProvider/SelectionProvider";
import { Highlighter, type IHighlighterColor } from "../Highlighter/Highlighter";
import { useTextLayer } from "../utils";

const SELECTION_COLOR: IHighlighterColor = { r: 0, g: 100, b: 200 };
const SELECTION_OPACITY = 0.3;
const SCROLL_TO_OFFSET_PX: number = 200;

export function SelectionRenderer() {
  const { viewer, eventBus } = useContext(PdfContext) as IPdfContext;
  const { selectedBlocks, pageNumber, lastScrolledTo, setSelectionString } = useContext(
    SelectionContext,
  ) as ISelectionContext;
  const { pageOffsets } = useContext(PdfContext) as IPdfContext;
  const textLayerRendered = useTextLayer(eventBus);
  const [retryScrolling, setRetryScrolling] = useState(0);

  useEffect(() => {
    // not ready yet
    if (!viewer) return;
    if (!selectedBlocks.length) return;

    // NOTE: if there is too much of this in the console, it means the effect is firing
    // too often!
    console.debug("scroll: checking if we need to scroll");
    // we don't need to scroll.
    if (isSameBlock(selectedBlocks[0], lastScrolledTo.current)) {
      return;
    }

    const pageOffset = pageOffsets.current[selectedBlocks[0].pageNumber];
    if (!pageOffset) {
      // we don't have an offset yet, so we will retry in a second or so.
      setTimeout(() => {
        setRetryScrolling(retryScrolling + 1);
      }, 100);
      return;
    }

    const topBlock = selectedBlocks.reduce<ISynctexBlock>((result, block) => {
      if (block.top - block.height < result.top - result.height) return block;
      return result;
    }, selectedBlocks[0]);

    const topBlockOffset = pageOffset.top + (topBlock.top - topBlock.height) * pageOffset.height;

    viewer.container.scrollTo({ top: topBlockOffset - SCROLL_TO_OFFSET_PX });

    // update last scrolled to location.
    lastScrolledTo.current = selectedBlocks[0];
  }, [selectedBlocks, viewer, lastScrolledTo, retryScrolling, pageOffsets]);

  useEffect(() => {
    if (!selectedBlocks.length) {
      setSelectionString("");
    }
  }, [selectedBlocks, setSelectionString]);

  useEffect(() => {
    if (!viewer || !selectedBlocks.length || pageNumber === null || !textLayerRendered.includes(pageNumber)) return;

    const pageElement = viewer.getPageView(pageNumber - 1)?.div;
    const textLayerElement = viewer.getPageView(pageNumber - 1)?.textLayer?.div;
    const selection = document.getSelection();

    if (!pageElement || !textLayerElement || !selection) return;

    const pageRect = subtractBorder(pageElement.getBoundingClientRect(), pageElement);
    const selectedBlockRects = selectedBlocks.map((block) => {
      return new DOMRect(
        pageRect.left + block.left * pageRect.width,
        pageRect.top + (block.top - block.height) * pageRect.height,
        block.width * pageRect.width,
        block.height * pageRect.height,
      );
    });

    selection.removeAllRanges();

    const walker = document.createTreeWalker(textLayerElement, NodeFilter.SHOW_TEXT);
    let node: Node | null;

    // biome-ignore lint/suspicious/noAssignInExpressions: this is the most efficient way of traversing all contained text nodes
    while ((node = walker.nextNode())) {
      const range = document.createRange();
      range.selectNodeContents(node);

      const rects = range.getClientRects();

      for (const rect of rects) {
        for (const blockRect of selectedBlockRects) {
          if (rectanglesIntersect(rect, blockRect)) {
            if (selection.anchorNode) {
              selection.getRangeAt(0)?.setEnd(node, node.textContent?.length || 0);
            } else {
              selection.addRange(range);
            }
            break;
          }
        }
      }
    }

    setSelectionString(document.getSelection()?.toString() || "");
  }, [selectedBlocks, pageNumber, viewer, textLayerRendered, setSelectionString]);

  const pageOffset = pageNumber ? pageOffsets.current[pageNumber] : null;

  if (!viewer || !pageOffset) return null;

  return (
    <Highlighter blocks={selectedBlocks} pageOffset={pageOffset} color={SELECTION_COLOR} opacity={SELECTION_OPACITY} />
  );
}

function rectanglesIntersect(r1: DOMRect, r2: DOMRect) {
  return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
}
