import type * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { useEffect, useRef } from "react";

export function useTextLayerRendered(eventBus: pdfJsViewer.EventBus | undefined) {
  const textLayerRenderedRef = useRef<number[]>([]);

  useEffect(() => {
    if (!eventBus) {
      return;
    }

    const handleTextLayerRendered = (e: { pageNumber: number }) => {
      textLayerRenderedRef.current = Array.from(new Set([...textLayerRenderedRef.current, e.pageNumber]));
    };

    eventBus.on("textlayerrendered", handleTextLayerRendered);

    return () => {
      eventBus.off("textlayerrendered", handleTextLayerRendered);
    };
  }, [eventBus]);

  return { textLayerRenderedRef };
}
