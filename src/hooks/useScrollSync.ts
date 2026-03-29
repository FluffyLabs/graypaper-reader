import type * as pdfJsViewer from "pdfjs-dist/web/pdf_viewer.mjs";
import { useEffect, useRef } from "react";
import type { ScrollSyncTarget } from "../components/SplitScreenProvider/SplitScreenProvider";

/**
 * Publishes scroll position from a PDF viewer as a normalized target.
 */
export function useScrollSyncPublisher(
  viewer: pdfJsViewer.PDFViewer | undefined,
  paneId: "left" | "right",
  isEnabled: boolean,
  setScrollSyncTarget: (target: ScrollSyncTarget) => void,
) {
  // Guard against re-entrant scroll events caused by the consumer
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!viewer?.container || !isEnabled) return;

    const container = viewer.container;

    const handleScroll = () => {
      if (isSyncing.current) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      if (scrollHeight <= clientHeight) return;

      // Find the page that's at the top of the viewport
      let currentPage = 1;
      let pageTop = 0;
      let pageHeight = 0;

      for (let i = 0; i < viewer.pagesCount; i++) {
        const pageView = viewer.getPageView(i);
        if (!pageView?.div) continue;

        const div = pageView.div;
        pageTop = div.offsetTop;
        pageHeight = div.offsetHeight;

        if (pageTop + pageHeight > scrollTop) {
          currentPage = i + 1;
          break;
        }
      }

      const yFraction = pageHeight > 0 ? (scrollTop - pageTop) / pageHeight : 0;

      setScrollSyncTarget({
        page: currentPage,
        yFraction,
        sourcePane: paneId,
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [viewer, isEnabled, paneId, setScrollSyncTarget]);

  return isSyncing;
}

/**
 * Consumes scroll sync target and scrolls the viewer to the matching position.
 * Ignores targets that originated from this pane.
 */
export function useScrollSyncConsumer(
  viewer: pdfJsViewer.PDFViewer | undefined,
  paneId: "left" | "right",
  isEnabled: boolean,
  scrollSyncTarget: ScrollSyncTarget,
  isSyncingRef: React.MutableRefObject<boolean>,
) {
  useEffect(() => {
    if (!isEnabled || !viewer?.container || !scrollSyncTarget) return;
    // Only react to targets from the *other* pane
    if (scrollSyncTarget.sourcePane === paneId) return;

    const pageIndex = scrollSyncTarget.page - 1;
    if (pageIndex < 0 || pageIndex >= viewer.pagesCount) return;

    const pageView = viewer.getPageView(pageIndex);
    if (!pageView?.div) return;

    const pageTop = pageView.div.offsetTop;
    const pageHeight = pageView.div.offsetHeight;
    const targetScroll = pageTop + scrollSyncTarget.yFraction * pageHeight;

    // Suppress our own scroll handler while we programmatically scroll
    isSyncingRef.current = true;
    viewer.container.scrollTop = targetScroll;
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, [isEnabled, viewer, paneId, scrollSyncTarget, isSyncingRef]);
}
