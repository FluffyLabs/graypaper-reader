import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

export interface IFocusModeContext {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

const FocusModeContext = createContext<IFocusModeContext | null>(null);

export const useFocusModeContext = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusModeContext must be used within a FocusModeProvider");
  }
  return context;
};

function getInitialFocusMode(): boolean {
  // Check if embedded in an iframe
  try {
    if (window.self !== window.top) {
      return true;
    }
  } catch {
    // Cross-origin iframe - access to window.top throws, so we're embedded
    return true;
  }

  // Check URL hash for focus param (e.g. /#/VERSION/SELECTION?focus=1)
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  if (queryIndex !== -1) {
    const params = new URLSearchParams(hash.substring(queryIndex + 1));
    if (params.get("focus") === "1") {
      return true;
    }
  }

  return false;
}

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(getInitialFocusMode);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const context = useMemo(
    () => ({ isFocusMode, toggleFocusMode }),
    [isFocusMode, toggleFocusMode],
  );

  return <FocusModeContext.Provider value={context}>{children}</FocusModeContext.Provider>;
}
