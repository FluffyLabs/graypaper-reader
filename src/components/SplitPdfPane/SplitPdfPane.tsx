import { useContext } from "react";
import { useScrollSyncConsumer, useScrollSyncPublisher } from "../../hooks/useScrollSync";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { useSplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";

/**
 * Invisible wrapper placed inside a PdfProvider to hook up scroll sync.
 * Both panes publish and consume — scrolling either pane syncs the other.
 */
export function ScrollSyncBridge({ paneId }: { paneId: "left" | "right" }) {
  const { viewer } = useContext(PdfContext) as IPdfContext;
  const { isScrollLinked, scrollSyncTarget, setScrollSyncTarget } = useSplitScreenContext();

  const isSyncingRef = useScrollSyncPublisher(viewer, paneId, isScrollLinked, setScrollSyncTarget);
  useScrollSyncConsumer(viewer, paneId, isScrollLinked, scrollSyncTarget, isSyncingRef);

  return null;
}
