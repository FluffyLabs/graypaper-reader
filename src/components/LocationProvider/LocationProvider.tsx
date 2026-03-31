import { type ISelectionParams, type ISynctexBlock, isSameBlock } from "@fluffylabs/links-metadata";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { deserializeLegacyLocation } from "../../utils/deserializeLegacyLocation";
import { type IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";
import { useGetLocationParamsToHash } from "./hooks/useGetLocationParamsToHash";
import type { ILocationParams } from "./types";
import {
  BASE64_VALIDATION_REGEX,
  SEGMENT_SEPARATOR,
  SELECTION_DECOMPOSE_PATTERN,
  SELECTION_SEGMENT_INDEX,
  VERSION_SEGMENT_INDEX,
} from "./utils/constants";
import { extractSearchParams } from "./utils/extractSearchParams";
import { locationParamsToHash } from "./utils/locationParamsToHash";
import { resolveFullVersion as resolveFullVersionUtil } from "./utils/resolveFullVersion";

export interface ILocationContext {
  locationParams: ILocationParams;
  setLocationParams: (newParams: ILocationParams) => void;
  synctexBlocksToSelectionParams: (blocks: ISynctexBlock[]) => ISelectionParams;
  getHashFromLocationParams: (params: ILocationParams) => string;
}

interface ILocationProviderProps {
  children: ReactNode;
}

export const LocationContext = createContext<ILocationContext | null>(null);

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
};

export function LocationProvider({ children }: ILocationProviderProps) {
  const { metadata } = useContext(MetadataContext) as IMetadataContext;
  const [locationParams, setLocationParams] = useState<ILocationParams>();
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  useEffect(() => {
    if (
      !window.location.hash.startsWith("#/") &&
      BASE64_VALIDATION_REGEX.test(window.location.hash) &&
      deserializeLegacyLocation(window.location.hash)
    ) {
      window.location.replace(urlGetters.legacyReaderRedirect(window.location.hash));
    }
  }, [urlGetters]);

  const handleSetLocationParams = useCallback(
    (newParams?: ILocationParams) => {
      if (!newParams) return;
      const hash = locationParamsToHash(newParams, metadata);
      window.location.hash = hash;
    },
    [metadata],
  );

  const { getHashFromLocationParams } = useGetLocationParamsToHash();

  const resolveFullVersion = useCallback(
    (shortVersion: string): string | null => resolveFullVersionUtil(shortVersion, metadata),
    [metadata],
  );

  const handleHashChange = useCallback(() => {
    const { rest: newHash, search, section, split } = extractSearchParams(window.location.hash);

    const resolvedSplit = split ? (resolveFullVersion(split) ?? undefined) : undefined;

    if (!newHash.startsWith(SEGMENT_SEPARATOR)) {
      const version = metadata.latest;
      setLocationParams((params) => ({
        ...params,
        version,
        search,
        section,
        split: resolvedSplit,
      }));
      handleSetLocationParams({ version, search, section, split: resolvedSplit });
      return;
    }

    const rawParams = newHash.split(SEGMENT_SEPARATOR).slice(1);
    const selectedVersion = rawParams[VERSION_SEGMENT_INDEX];

    const fullVersion = resolveFullVersion(selectedVersion);

    if (!fullVersion) {
      const version = metadata.latest;
      setLocationParams((params) => ({
        ...params,
        version,
        search,
        section,
        split: resolvedSplit,
      }));
      handleSetLocationParams({ version, search, section, split: resolvedSplit });
      return;
    }

    const newLocationParams: ILocationParams = {
      version: fullVersion,
      search,
      section,
      split: resolvedSplit,
    };

    if (rawParams[SELECTION_SEGMENT_INDEX]) {
      const matchedHexSegments = [...rawParams[SELECTION_SEGMENT_INDEX].matchAll(SELECTION_DECOMPOSE_PATTERN)];

      if (matchedHexSegments.length === 2) {
        newLocationParams.selectionStart = decodePageNumberAndIndex(matchedHexSegments[0][0]);
        newLocationParams.selectionEnd = decodePageNumberAndIndex(matchedHexSegments[1][0]);
      }
    }

    // Update location but only if it has REALLY changed.
    setLocationParams((params) => {
      if (!isSameBlock(params?.selectionStart, newLocationParams.selectionStart)) {
        return newLocationParams;
      }
      if (!isSameBlock(params?.selectionEnd, newLocationParams.selectionEnd)) {
        return newLocationParams;
      }
      if (params?.version !== newLocationParams.version) {
        return newLocationParams;
      }
      if (params?.search !== newLocationParams.search) {
        return newLocationParams;
      }
      if (params?.section !== newLocationParams.section) {
        return newLocationParams;
      }
      if (params?.split !== newLocationParams.split) {
        return newLocationParams;
      }
      return params;
    });
  }, [handleSetLocationParams, metadata, resolveFullVersion]);

  const synctexBlocksToSelectionParams: ILocationContext["synctexBlocksToSelectionParams"] = useCallback((blocks) => {
    const blockIds = blocks.map((block) => ({ pageNumber: block.pageNumber, index: block.index }));
    const lowestBlockId = blockIds.reduce((result, blockId) => {
      if (blockId.pageNumber < result.pageNumber) return blockId;
      if (blockId.pageNumber === result.pageNumber && blockId.index < result.index) return blockId;

      return result;
    }, blockIds[0]);
    const highestBlockId = blockIds.reduce((result, blockId) => {
      if (blockId.pageNumber > result.pageNumber) return blockId;
      if (blockId.pageNumber === result.pageNumber && blockId.index > result.index) return blockId;

      return result;
    }, blockIds[0]);

    return {
      selectionStart: lowestBlockId,
      selectionEnd: highestBlockId,
    };
  }, []);

  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [handleHashChange]);

  const context = useMemo(() => {
    if (!locationParams) {
      return null;
    }

    return {
      locationParams,
      setLocationParams: handleSetLocationParams,
      synctexBlocksToSelectionParams,
      getHashFromLocationParams,
    };
  }, [locationParams, handleSetLocationParams, synctexBlocksToSelectionParams, getHashFromLocationParams]);

  if (!context) {
    return null;
  }

  return <LocationContext.Provider value={context}>{children}</LocationContext.Provider>;
}

function decodePageNumberAndIndex(s: string) {
  if (s.length > 6) throw new Error("Pass exactly 6 hex characters");
  const fromHex = (s: string) => Number(`0x${s}`);
  const pageNumber = fromHex(s.substring(0, 2));
  let index = fromHex(s.substring(2, 4));
  index += fromHex(s.substring(4, 6)) << 8;
  return { pageNumber, index };
}
