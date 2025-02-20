import type * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { useEffect, useState } from "react";

export function useTextLayer(eventBus: pdfJsViewer.EventBus | undefined) {
  const [textLayerRendered, setTextLayerRendered] = useState<number[]>([]);

  useEffect(() => {
    const handleTextLayerRendered = (e: { pageNumber: number }) => {
      setTextLayerRendered((textLayerRendered) => [...textLayerRendered, e.pageNumber]);
    };

    eventBus?.on("textlayerrendered", handleTextLayerRendered);

    return () => {
      eventBus?.off("textlayerrendered", handleTextLayerRendered);
    };
  }, [eventBus]);

  return textLayerRendered;
}
