import { useCallback, useEffect } from "react";
import type { IframeController } from "../../utils/IframeController";
import "./ThemeToggler.css";
import { Tooltip } from "react-tooltip";

const LS_KEY = "theme";
const DEFAULT_THEME = "dark";
function readTheme() {
  return window.localStorage.getItem(LS_KEY) ?? DEFAULT_THEME;
}

function writeTheme(theme: string) {
  window.localStorage.setItem(LS_KEY, theme);
}

const initialTheme = readTheme();

export function ThemeToggler({ iframeCtrl }: { iframeCtrl: IframeController }) {
  const toggleTheme = useCallback(() => {
    const isLight = iframeCtrl.toggleTheme();
    writeTheme(isLight ? "light" : DEFAULT_THEME);
  }, [iframeCtrl]);

  useEffect(() => {
    iframeCtrl.toggleTheme(initialTheme !== DEFAULT_THEME);
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
