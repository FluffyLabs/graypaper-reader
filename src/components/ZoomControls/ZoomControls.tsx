import {
  type ChangeEventHandler,
  type FocusEventHandler,
  type FormEventHandler,
  type MouseEventHandler,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./ZoomControls.css";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { MAX_SCALE, MIN_SCALE } from "../PdfViewer/PdfViewer";

const STEP = 0.15;
const SCALE_TO_PERCENTAGE = 100;

export function ZoomControls() {
  const { viewer, scale } = useContext(PdfContext) as IPdfContext;
  const [scaleInputValue, setScaleInputValue] = useState<number | "">("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleFormSubmit: FormEventHandler = (e) => {
    e.preventDefault();

    if (!viewer || !scaleInputValue) return;

    const newScale = scaleInputValue / SCALE_TO_PERCENTAGE;

    viewer.currentScaleValue = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)).toString();
  };

  const handleZoomInClick: MouseEventHandler = () => {
    if (!viewer) return;
    viewer.currentScaleValue = Math.min(MAX_SCALE, viewer.currentScale + STEP).toString();
  };

  const handleZoomOutClick: MouseEventHandler = () => {
    if (!viewer) return;
    viewer.currentScaleValue = Math.max(MIN_SCALE, viewer.currentScale - STEP).toString();
  };

  const handleScaleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setScaleInputValue(e.target.valueAsNumber || "");
  };

  const handleScaleInputBlur: FocusEventHandler<HTMLInputElement> = () => {
    formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  };

  useEffect(() => {
    setScaleInputValue(Math.round(scale * SCALE_TO_PERCENTAGE));
  }, [scale]);

  if (!viewer) return null;

  return (
    <div className="zoom-controls">
      <button onClick={handleZoomOutClick}>-</button>
      <form onSubmit={handleFormSubmit} ref={formRef}>
        <input type="number" value={scaleInputValue} onChange={handleScaleInputChange} onBlur={handleScaleInputBlur} />
      </form>
      <span>%</span>
      <button onClick={handleZoomInClick}>+</button>
    </div>
  );
}
