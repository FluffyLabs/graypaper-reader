import "./BottomDrawer.css";

import { useCallback, useRef, useState } from "react";
import { Sidebar } from "../Sidebar/Sidebar";

const SWIPE_THRESHOLD = 50;

export function BottomDrawer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (dragStartY.current === null) return;
      const deltaY = e.changedTouches[0].clientY - dragStartY.current;
      dragStartY.current = null;

      if (isExpanded && deltaY > SWIPE_THRESHOLD) {
        setIsExpanded(false);
      } else if (!isExpanded && deltaY < -SWIPE_THRESHOLD) {
        setIsExpanded(true);
      }
    },
    [isExpanded],
  );

  const handleHandleClick = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className={`bottom-drawer ${isExpanded ? "expanded" : "collapsed"}`}>
      <button
        type="button"
        className="drawer-handle"
        onClick={handleHandleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <div className="drawer-content">
        <Sidebar />
      </div>
    </div>
  );
}
