import { useIsDarkMode } from "@krystian5011/shared-ui";
import { useEffect, useRef } from "react";

export const LightDarkThemeSyncer = () => {
  const isDarkMode = useIsDarkMode();

  const htmlRef = useRef(() => document.querySelector("html"));
  useEffect(() => {
    const htmlElement = htmlRef.current();
    if (htmlElement) {
      htmlElement.classList.toggle("dark", isDarkMode);
      htmlElement.classList.toggle("light", !isDarkMode);
    }
  }, [isDarkMode]);

  return null;
};
