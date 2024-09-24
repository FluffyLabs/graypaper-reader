import { type ChangeEventHandler, type MouseEventHandler, useContext } from "react";
import "./ZoomControls.css";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { MAX_SCALE, MIN_SCALE } from "../PdfViewer/PdfViewer";

const STEP = 0.15;
const SCALE_TO_PERCENTAGE = 100;

export function ZoomControls() {
  const { viewer, scale } = useContext(PdfContext) as IPdfContext;
  const scalePercentage = Math.round(scale * SCALE_TO_PERCENTAGE);

  const handleZoomInClick: MouseEventHandler = () => {
    if (!viewer) return;
    viewer.currentScaleValue = Math.min(MAX_SCALE, viewer.currentScale + STEP).toString();
  };

  const handleZoomOutClick: MouseEventHandler = () => {
    if (!viewer) return;
    viewer.currentScaleValue = Math.max(MIN_SCALE, viewer.currentScale - STEP).toString();
  };

  const handleScaleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!viewer) return;

    const newScale = e.target.valueAsNumber / SCALE_TO_PERCENTAGE;

    if (newScale > MIN_SCALE && newScale < MAX_SCALE) {
      viewer.currentScaleValue = newScale.toString();
    }
  };

  if (!viewer) return null;

  return (
    <div className="zoom-controls">
      <button onClick={handleZoomOutClick}>-</button>
      <input type="number" value={scalePercentage} onChange={handleScaleInputChange} />
      <span>%</span>
      <button onClick={handleZoomInClick}>+</button>
    </div>
  );
}
