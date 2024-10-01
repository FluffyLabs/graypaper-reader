import { type MouseEventHandler, useContext } from "react";
import "./ZoomControls.css";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { MAX_SCALE, MIN_SCALE } from "../PdfViewer/PdfViewer";

const STEP = 0.15;
export function ZoomControls() {
  const { viewer } = useContext(PdfContext) as IPdfContext;

  const handleZoomInClick: MouseEventHandler = () => {
    if (!viewer) return;
    viewer.currentScaleValue = calcScale(viewer.currentScale, STEP);
  };

  const handleZoomOutClick: MouseEventHandler = () => {
    if (!viewer) return;
    viewer.currentScaleValue = calcScale(viewer.currentScale, -STEP);
  };

  if (!viewer) return null;

  return (
    <div className="zoom-controls">
      <button className="in" onClick={handleZoomInClick}>
        +
      </button>
      <button onClick={handleZoomOutClick}>−</button>
    </div>
  );
}

function calcScale(current: number, change: number): string {
  const scale = Number.parseInt(`${current * 100 + change * 100}`) / 100;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)).toString();
}
