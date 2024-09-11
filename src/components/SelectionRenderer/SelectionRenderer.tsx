import { useContext, useMemo } from "react";
import { subtractBorder } from "../../utils/subtractBorder";
import { Highlighter, type IHighlighterColor } from "../Highlighter/Highlighter";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

const SELECTION_COLOR: IHighlighterColor = { r: 0, g: 229, b: 255 };

export function SelectionRenderer() {
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const { selectedBlocks, pageNumber } = useContext(SelectionContext) as ISelectionContext;

  const pageOffset = useMemo(() => {
    if (!viewer || pageNumber === null) return null;

    const pageElement = viewer.getPageView(pageNumber - 1)?.div;

    return subtractBorder(
      new DOMRect(pageElement.offsetLeft, pageElement.offsetTop, pageElement.offsetWidth, pageElement.offsetHeight),
      pageElement,
    );
  }, [pageNumber, viewer]);

  if (!viewer || !pageOffset) return null;

  return <Highlighter blocks={selectedBlocks} pageOffset={pageOffset} color={SELECTION_COLOR} />;
}
