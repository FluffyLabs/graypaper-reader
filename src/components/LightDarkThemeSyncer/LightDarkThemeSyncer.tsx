import { useIsDarkMode } from "@krystian5011/shared-ui";
import { useEffect } from "react";

export const LightDarkThemeSyncer = () => {
  const isDarkMode = useIsDarkMode();

  useEffect(() => {
    const htmlElement = document.querySelector("html");

    if (htmlElement) {
      htmlElement.classList.toggle("dark", isDarkMode);
      htmlElement.classList.toggle("light", !isDarkMode);
    }
  }, [isDarkMode]);

  return null;
};
