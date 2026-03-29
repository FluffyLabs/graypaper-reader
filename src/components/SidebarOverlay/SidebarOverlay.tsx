import "./SidebarOverlay.css";

import { Button } from "@fluffylabs/shared-ui";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Sidebar } from "../Sidebar/Sidebar";
import { useSplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";

export function SidebarOverlay() {
  const { isSidebarOverlayOpen, setSidebarOverlayOpen } = useSplitScreenContext();

  useEffect(() => {
    if (!isSidebarOverlayOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOverlayOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOverlayOpen, setSidebarOverlayOpen]);

  if (!isSidebarOverlayOpen) return null;

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-dismiss */}
      <div className="sidebar-overlay-backdrop" onClick={() => setSidebarOverlayOpen(false)} />
      <div className="sidebar-overlay-panel" role="dialog" aria-modal="true" aria-label="Sidebar">
        <div className="sidebar-overlay-header">
          <Button
            variant="tertiary"
            forcedColorScheme="dark"
            onClick={() => setSidebarOverlayOpen(false)}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="sidebar-overlay-content">
          <Sidebar />
        </div>
      </div>
    </>
  );
}
