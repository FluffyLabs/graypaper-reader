import { useEffect } from "react";

export const LightDarkThemeSyncer = () => {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", true);
  }, []);

  return null;
};
