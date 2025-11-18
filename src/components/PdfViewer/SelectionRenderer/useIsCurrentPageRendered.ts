import { useContext, useEffect, useState } from "react";
import { type IPdfContext, PdfContext } from "../../PdfProvider/PdfProvider";
import { type ISelectionContext, SelectionContext } from "../../SelectionProvider/SelectionProvider";

export const useIsCurrentPageRendered = () => {
  const { textLayerRenderedRef, eventBus } = useContext(PdfContext) as IPdfContext;
  const [isCurrentPageTextLayerRendered, setIsCurrentPageTextLayerRendered] = useState(false);

  const { pageNumber } = useContext(SelectionContext) as ISelectionContext;

  useEffect(() => {
    if (pageNumber === null) {
      setIsCurrentPageTextLayerRendered(false);
    } else {
      setIsCurrentPageTextLayerRendered(textLayerRenderedRef.current.includes(pageNumber));
    }
  }, [pageNumber, textLayerRenderedRef]);

  useEffect(() => {
    if (!eventBus || pageNumber === null) return;

    const handleTextLayerRendered = (e: { pageNumber: number }) => {
      if (e.pageNumber === pageNumber) {
        setIsCurrentPageTextLayerRendered(true);
      }
    };

    eventBus.on("textlayerrendered", handleTextLayerRendered);

    return () => {
      eventBus.off("textlayerrendered", handleTextLayerRendered);
    };
  }, [eventBus, pageNumber]);

  return {
    isCurrentPageTextLayerRendered,
  };
};
