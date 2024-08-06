import { useCallback } from "react";
import type { IframeController } from "../../utils/IframeController";
import "./ThemeToggler.css";
import { Tooltip } from "react-tooltip";

export function ThemeToggler({ iframeCtrl }: { iframeCtrl: IframeController }) {
  const toggleTheme = useCallback(() => {
    iframeCtrl.toggleTheme();
  }, [iframeCtrl]);

  return (
    <div className="theme-toggler">
      <button data-tooltip-id="theme" data-tooltip-content="Toggle Gray Paper theme" onClick={toggleTheme}>
        💡
      </button>
      <Tooltip id="theme" />
    </div>
  );
}
