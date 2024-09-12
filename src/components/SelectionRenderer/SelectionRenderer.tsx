import { useContext, useEffect, useMemo } from "react";
import { subtractBorder } from "../../utils/subtractBorder";
import type { ISynctexBlock } from "../CodeSyncProvider/CodeSyncProvider";
import { Highlighter, type IHighlighterColor } from "../Highlighter/Highlighter";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

const SELECTION_COLOR: IHighlighterColor = { r: 0, g: 229, b: 255 };
const SCROLL_TO_OFFSET_PX: number = 200;

export function SelectionRenderer() {
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const { selectedBlocks, pageNumber, scrollToSelection, setScrollToSelection } = useContext(
    SelectionContext,
  ) as ISelectionContext;

  const pageOffset = useMemo(() => {
    if (!viewer || pageNumber === null) return null;

    const pageElement = viewer.getPageView(pageNumber - 1)?.div;

    return subtractBorder(
      new DOMRect(pageElement.offsetLeft, pageElement.offsetTop, pageElement.offsetWidth, pageElement.offsetHeight),
      pageElement,
    );
  }, [pageNumber, viewer]);

  useEffect(() => {
    if (!viewer) return;

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
  }, [selectedBlocks, viewer, pageOffset, scrollToSelection, setScrollToSelection]);

  if (!viewer || !pageOffset) return null;

  return <Highlighter blocks={selectedBlocks} pageOffset={pageOffset} color={SELECTION_COLOR} />;
}
