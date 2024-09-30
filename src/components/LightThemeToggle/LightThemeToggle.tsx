import { useCallback, useContext } from "react";
import { Tooltip } from "react-tooltip";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";

export function LightThemeToggle() {
  const { lightThemeEnabled, setLightThemeEnabled } = useContext(PdfContext) as IPdfContext;

  const handleButtonClick = useCallback(() => {
    setLightThemeEnabled(!lightThemeEnabled);
  }, [setLightThemeEnabled, lightThemeEnabled]);

  return (
    <div>
      <button
        data-tooltip-id="theme"
        data-tooltip-content="Toggle between light and dark theme"
        data-tooltip-place="left"
        onClick={handleButtonClick}
        className={`light-theme-toggle ${lightThemeEnabled ? "toggled" : ""}`}
      >
        💡
      </button>
      <Tooltip id="theme" />
    </div>
  );
}
