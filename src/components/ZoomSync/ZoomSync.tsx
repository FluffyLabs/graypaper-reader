import { useContext, useEffect, useRef } from "react";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { useSplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";

/**
 * Bridges zoom between a PdfViewer and the shared scale in SplitScreenProvider.
 * - Publishes local scale changes to sharedScale.
 * - Consumes sharedScale changes from the other pane.
 */
export function ZoomSyncBridge() {
  const { viewer, scale } = useContext(PdfContext) as IPdfContext;
  const { sharedScale, setSharedScale, isSplitActive } = useSplitScreenContext();
  const isApplying = useRef(false);

  // Publish: when this pane's scale changes, update shared scale
  useEffect(() => {
    if (!isSplitActive || !scale || isApplying.current) return;
    setSharedScale(scale);
  }, [scale, isSplitActive, setSharedScale]);

  // Consume: when shared scale changes (from other pane), apply to this viewer
  useEffect(() => {
    if (!isSplitActive || !viewer || !sharedScale) return;
    if (Math.abs(viewer.currentScale - sharedScale) < 0.001) return;

    isApplying.current = true;
    viewer.currentScaleValue = sharedScale.toString();
    requestAnimationFrame(() => {
      isApplying.current = false;
    });
  }, [isSplitActive, viewer, sharedScale]);

  return null;
}
