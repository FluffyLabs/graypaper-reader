import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";

export interface ILocationContext {
  locationParams: ILocationParams;
  setLocationParams: (newParams: ILocationParams) => void;
}

interface ILocationParams {
  version: string;
  selection?: { pageNumber: number; index: number }[];
}

interface ILocationProviderProps {
  children: ReactNode;
}

const VERSION_SEARCH_KEY = "version";
const SELECTION_SEARCH_KEY = "selection";
const SELECTION_DECOMPOSE_PATTERN = /([0-9]+),([0-9]+)/g;

export const LocationContext = createContext<ILocationContext | null>(null);

export function LocationProvider({ children }: ILocationProviderProps) {
  const { metadata } = useContext(MetadataContext) as IMetadataContext;
  const [locationParams, setLocationParams] = useState<ILocationParams>();

  const handleSetLocationParams = useCallback(
    (newParams?: ILocationParams) => {
      const version = newParams?.version || metadata.latest;

      const stringifiedParams = [[VERSION_SEARCH_KEY, version]];

      if (newParams?.selection) {
        stringifiedParams.push([
          SELECTION_SEARCH_KEY,
          newParams.selection.map(({ pageNumber, index }) => `${pageNumber},${index}`).join(","),
        ]);
      }

      window.location.hash = new URLSearchParams(stringifiedParams).toString();
    },
    [metadata.latest]
  );

  const handleHashChange = useCallback(() => {
    const newHash = window.location.hash.substring(1);

    if (!newHash) {
      handleSetLocationParams();
      return;
    }

    const rawParams = Object.fromEntries(new URLSearchParams(newHash));

    if (!rawParams[VERSION_SEARCH_KEY]) {
      handleSetLocationParams();
      return;
    }

    const processedParams: ILocationParams = {
      version: rawParams[VERSION_SEARCH_KEY],
    };

    if (rawParams[SELECTION_SEARCH_KEY]) {
      const matchedDigitPairs = [...rawParams[SELECTION_SEARCH_KEY].matchAll(SELECTION_DECOMPOSE_PATTERN)];

      if (matchedDigitPairs.length) {
        processedParams.selection = matchedDigitPairs.map((digitPair) => ({
          pageNumber: Number.parseInt(digitPair[1]),
          index: Number.parseInt(digitPair[2]),
        }));
      }
    }

    setLocationParams(processedParams);
  }, [handleSetLocationParams]);

  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [handleHashChange]);

  useEffect(() => {
    handleHashChange();
  }, [handleHashChange]);

  if (!locationParams) return null;

  const context = { locationParams, setLocationParams: handleSetLocationParams };

  return <LocationContext.Provider value={context}>{children}</LocationContext.Provider>;
}
