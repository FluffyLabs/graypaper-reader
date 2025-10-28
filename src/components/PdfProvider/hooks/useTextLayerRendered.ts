import type * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { useEffect, useRef } from "react";

export function useTextLayerRendered(eventBus: pdfJsViewer.EventBus | undefined) {
  const textLayerRenderedRef = useRef<number[]>([]);

  useEffect(() => {
    if (!eventBus) {
      return;
    }

    const handleTextLayerRendered = (e: { pageNumber: number }) => {
      if (!textLayerRenderedRef.current.includes(e.pageNumber)) {
        textLayerRenderedRef.current.push(e.pageNumber);
      }
    };

    eventBus.on("textlayerrendered", handleTextLayerRendered);

    return () => {
      textLayerRenderedRef.current = [];
      eventBus.off("textlayerrendered", handleTextLayerRendered);
    };
  }, [eventBus]);

  return { textLayerRenderedRef };
}
