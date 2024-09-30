import { useContext, useEffect, useMemo, useState } from "react";
import { usePrevious } from "../../hooks/usePrevious";
import { subtractBorder } from "../../utils/subtractBorder";
import type { ISynctexBlock } from "../CodeSyncProvider/CodeSyncProvider";
import { Highlighter, type IHighlighterColor } from "../Highlighter/Highlighter";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

const SELECTION_COLOR: IHighlighterColor = { r: 0, g: 100, b: 200 };
const SELECTION_OPACITY = 0.5;
const SCROLL_TO_OFFSET_PX: number = 200;

export function SelectionRenderer() {
  const { viewer, eventBus } = useContext(PdfContext) as IPdfContext;
  const { selectedBlocks, pageNumber, scrollToSelection, setScrollToSelection, setSelectionString } = useContext(
    SelectionContext,
  ) as ISelectionContext;
  const [textLayerRendered, setTextLayerRendered] = useState<number[]>([]);
  const previousScrollToSelection = usePrevious(scrollToSelection);

  const pageOffset = useMemo(() => {
    if (!viewer || pageNumber === null) return null;

    const pageElement = viewer.getPageView(pageNumber - 1)?.div;

    return subtractBorder(
      new DOMRect(pageElement.offsetLeft, pageElement.offsetTop, pageElement.offsetWidth, pageElement.offsetHeight),
      pageElement,
    );
  }, [pageNumber, viewer]);

  useEffect(() => {
    if (!viewer || (!previousScrollToSelection && scrollToSelection)) return;

    if (scrollToSelection) {
      if (selectedBlocks.length && pageOffset) {
        const topBlock = selectedBlocks.reduce<ISynctexBlock>((result, block) => {
          if (block.top - block.height < result.top - result.height) return block;
          return result;
        }, selectedBlocks[0]);

        const topBlockOffset = pageOffset.top + (topBlock.top - topBlock.height) * pageOffset.height;

        viewer.container.scrollTo({ top: topBlockOffset - SCROLL_TO_OFFSET_PX });
      }

      setScrollToSelection(false);
    }
  }, [selectedBlocks, viewer, pageOffset, scrollToSelection, setScrollToSelection, previousScrollToSelection]);

  useEffect(() => {
    const handleTextLayerRendered = (e: { pageNumber: number }) => {
      setTextLayerRendered((textLayerRendered) => [...textLayerRendered, e.pageNumber]);
    };

    eventBus?.on("textlayerrendered", handleTextLayerRendered);

    return () => {
      eventBus?.off("textlayerrendered", handleTextLayerRendered);
    };
  }, [eventBus]);

  useEffect(() => {
    if (!selectedBlocks.length) {
      setSelectionString("");
    }
  }, [selectedBlocks, setSelectionString]);

  useEffect(() => {
    if (!viewer || !selectedBlocks.length || pageNumber === null || !textLayerRendered.includes(pageNumber)) return;

    const pageElement = viewer.getPageView(pageNumber - 1)?.div;
    const textLayerElement = viewer.getPageView(pageNumber - 1)?.textLayer.div;
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

  if (!viewer || !pageOffset) return null;

  return (
    <Highlighter blocks={selectedBlocks} pageOffset={pageOffset} color={SELECTION_COLOR} opacity={SELECTION_OPACITY} />
  );
}

function rectanglesIntersect(r1: DOMRect, r2: DOMRect) {
  return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
}
