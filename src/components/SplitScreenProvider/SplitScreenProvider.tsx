import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import type { ITheme } from "../PdfProvider/PdfProvider";

const THEME_LOCAL_STORAGE_KEY = "theme";

function loadThemeSettingFromLocalStorage(): ITheme {
  const localStorageValue = window.localStorage.getItem(THEME_LOCAL_STORAGE_KEY) ?? "false";
  switch (localStorageValue.toLowerCase()) {
    case "light":
      return "light";
    case "gray":
      return "gray";
    case "dark":
      return "dark";
    default:
      return "dark";
  }
}

function saveThemeSettingToLocalStorage(value: ITheme) {
  try {
    window.localStorage.setItem(THEME_LOCAL_STORAGE_KEY, value);
  } catch (e) {
    console.error(`Unable to save theme setting: ${e}`);
  }
}

export type ScrollSyncTarget = {
  page: number;
  yFraction: number;
  sourcePane: "left" | "right";
} | null;

export interface ISplitScreenContext {
  isSplitActive: boolean;
  activateSplit: () => void;
  activateCompare: (rightVersion: string) => void;
  deactivateSplit: () => void;

  rightVersion: string | null;
  setRightVersion: (v: string | null) => void;

  isScrollLinked: boolean;
  setScrollLinked: Dispatch<SetStateAction<boolean>>;
  scrollSyncTarget: ScrollSyncTarget;
  setScrollSyncTarget: Dispatch<SetStateAction<ScrollSyncTarget>>;

  isSidebarOverlayOpen: boolean;
  setSidebarOverlayOpen: Dispatch<SetStateAction<boolean>>;

  theme: ITheme;
  setTheme: Dispatch<SetStateAction<ITheme>>;

  sharedScale: number;
  setSharedScale: (scale: number) => void;
}

export const SplitScreenContext = createContext<ISplitScreenContext | null>(null);

export function useSplitScreenContext() {
  const context = useContext(SplitScreenContext);
  if (!context) {
    throw new Error("useSplitScreenContext must be used within a SplitScreenProvider");
  }
  return context;
}

interface ISplitScreenProviderProps {
  children: ReactNode;
}

export function SplitScreenProvider({ children }: ISplitScreenProviderProps) {
  const { locationParams, setLocationParams } = useContext(LocationContext) as ILocationContext;

  const [isScrollLinked, setScrollLinked] = useState(false);
  const [scrollSyncTarget, setScrollSyncTarget] = useState<ScrollSyncTarget>(null);
  const [isSidebarOverlayOpen, setSidebarOverlayOpen] = useState(false);
  const [theme, setTheme] = useState<ITheme>(loadThemeSettingFromLocalStorage());
  const [sharedScale, setSharedScale] = useState<number>(0.85);

  // Derive split state from URL
  const isSplitActive = !!locationParams.split;
  const rightVersion = locationParams.split ?? null;

  useEffect(() => {
    saveThemeSettingToLocalStorage(theme);
  }, [theme]);

  // Auto-enable scroll linking when comparing different versions
  const activateSplit = useCallback(() => {
    setScrollLinked(false);
    setSidebarOverlayOpen(false);
    setLocationParams({
      ...locationParams,
      split: locationParams.version,
    });
  }, [locationParams, setLocationParams]);

  const activateCompare = useCallback(
    (targetVersion: string) => {
      const isDifferentVersion = targetVersion !== locationParams.version;
      setScrollLinked(isDifferentVersion);
      setSidebarOverlayOpen(false);
      setLocationParams({
        ...locationParams,
        split: targetVersion,
      });
    },
    [locationParams, setLocationParams],
  );

  const deactivateSplit = useCallback(() => {
    setScrollLinked(false);
    setSidebarOverlayOpen(false);
    const { split: _, ...rest } = locationParams;
    setLocationParams(rest);
  }, [locationParams, setLocationParams]);

  const setRightVersion = useCallback(
    (v: string | null) => {
      if (v) {
        const isDifferentVersion = v !== locationParams.version;
        setScrollLinked(isDifferentVersion);
        setLocationParams({
          ...locationParams,
          split: v,
        });
      } else {
        deactivateSplit();
      }
    },
    [locationParams, setLocationParams, deactivateSplit],
  );

  const context = useMemo<ISplitScreenContext>(
    () => ({
      isSplitActive,
      activateSplit,
      activateCompare,
      deactivateSplit,
      rightVersion,
      setRightVersion,
      isScrollLinked,
      setScrollLinked,
      scrollSyncTarget,
      setScrollSyncTarget,
      isSidebarOverlayOpen,
      setSidebarOverlayOpen,
      theme,
      setTheme,
      sharedScale,
      setSharedScale,
    }),
    [
      isSplitActive,
      activateSplit,
      activateCompare,
      deactivateSplit,
      rightVersion,
      setRightVersion,
      isScrollLinked,
      scrollSyncTarget,
      isSidebarOverlayOpen,
      theme,
      sharedScale,
    ],
  );

  return <SplitScreenContext.Provider value={context}>{children}</SplitScreenContext.Provider>;
}
