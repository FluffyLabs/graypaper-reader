import "./Resizable.css";
import { type ReactNode, useCallback, useState } from "react";

type ResizableProps = {
  left: ReactNode;
  right: ReactNode;
};

const SPLIT_THRESHOLD = 99;
const INITIAL_SPLIT = window.innerWidth <= 768 ? SPLIT_THRESHOLD : 70.0;

export function Resizable({ left, right }: ResizableProps) {
  const [isDragging, setDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  const [split, setSplit] = useState(INITIAL_SPLIT);
  const [lastSplit, setLastSplit] = useState(split === SPLIT_THRESHOLD ? 15.0 : split);

  const onStartDrag = useCallback(() => {
    const onDrag = (ev: MouseEvent) => {
      if (ev.buttons === 0) {
        stopDrag();
        return;
      }
      const xPos = ev.clientX;
      const xSize = window.innerWidth;
      setWasDragged(true);
      setSplit((xPos / xSize) * 100.0);
    };

    const stopDrag = () => {
      setDragging(false);
      setWasDragged(false);
      if (split < SPLIT_THRESHOLD) {
        setLastSplit(split);
      }
      document.removeEventListener("mousemove", onDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    setDragging(true);
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  }, [split]);

  const toggleRight = useCallback(() => {
    if (wasDragged) {
      return;
    }

    if (split >= SPLIT_THRESHOLD) {
      setSplit(lastSplit);
    } else {
      setSplit(SPLIT_THRESHOLD);
    }
  }, [wasDragged, split, lastSplit]);

  return (
    <div className={`resizable${isDragging ? " dragging" : ""}`}>
      <div className={`overlay${isDragging ? " active" : ""}`} onMouseUp={toggleRight} />
      <div className="left" style={{ width: `calc(${split}% - 6px)` }}>
        {left}
      </div>
      <div className="handle" onMouseDown={onStartDrag} />
      <div className="right" style={{ width: `${100 - split}%` }}>
        {right}
      </div>
    </div>
  );
}
