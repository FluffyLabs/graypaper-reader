import { useCallback, useContext } from "react";
import { Tooltip } from "react-tooltip";
import { type IPdfContext, PdfContext, themesOrder } from "../PdfProvider/PdfProvider";

export function LightThemeToggle() {
  const { theme, setTheme } = useContext(PdfContext) as IPdfContext;

  const handleButtonClick = useCallback(() => {
    const nextTheme = themesOrder[themesOrder.indexOf(theme) + 1];
    setTheme(nextTheme ?? themesOrder[0]);
  }, [setTheme, theme]);

  return (
    <div>
      <button
        data-tooltip-id="theme"
        data-tooltip-content="Toggle between light, gray and dark themes"
        data-tooltip-place="right"
        onClick={handleButtonClick}
        className={`default-button light-theme-toggle ${theme === "light" ? "toggled" : ""}`}
      >
        💡
      </button>
      <Tooltip id="theme" />
    </div>
  );
}
