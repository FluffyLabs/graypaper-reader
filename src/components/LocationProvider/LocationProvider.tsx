import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { deserializeLocation } from "../../utils/location";
import type { ISynctexBlock } from "../CodeSyncProvider/CodeSyncProvider";
import { type IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";

interface ISelectionParams {
  selectionStart?: { pageNumber: number; index: number };
  selectionEnd?: { pageNumber: number; index: number };
}

export interface ILocationContext {
  locationParams: ILocationParams;
  setLocationParams: (newParams: ILocationParams) => void;
  synctexBlocksToSelectionParams: (blocks: ISynctexBlock[]) => ISelectionParams;
}

interface ILocationParams extends ISelectionParams {
  version: string;
}

interface ILocationProviderProps {
  children: ReactNode;
}

const VERSION_SEGMENT_INDEX = 0;
const SELECTION_SEGMENT_INDEX = 1;
const SEGMENT_SEPARATOR = "/";
const SELECTION_DECOMPOSE_PATTERN = /[0-9A-F]{6}/gi;
const SHORT_COMMIT_HASH_LENGTH = 7; // as many as git uses for `git rev-parse --short`
const BASE64_VALIDATION_REGEX = /^#[-A-Za-z0-9+/]*={0,3}$/;

export const LocationContext = createContext<ILocationContext | null>(null);

export function LocationProvider({ children }: ILocationProviderProps) {
  const { metadata } = useContext(MetadataContext) as IMetadataContext;
  const [locationParams, setLocationParams] = useState<ILocationParams>();
  const { isLegacy, urlGetters } = useContext(MetadataContext) as IMetadataContext;

  useEffect(() => {
    if (!locationParams) return;

    if (isLegacy(locationParams.version)) {
      window.location.replace(urlGetters.legacyReaderVersion(locationParams.version));
    }
  }, [locationParams, isLegacy, urlGetters]);

  useEffect(() => {
    if (
      !window.location.hash.startsWith("#/") &&
      BASE64_VALIDATION_REGEX.test(window.location.hash) &&
      deserializeLocation(window.location.hash)
    ) {
      window.location.replace(urlGetters.legacyReaderRedirect(window.location.hash));
    }
  }, [urlGetters]);

  const handleSetLocationParams = useCallback(
    (newParams?: ILocationParams) => {
      const version =
        newParams?.version.substring(0, SHORT_COMMIT_HASH_LENGTH) ||
        metadata.versions[metadata.latest]?.hash.substring(0, SHORT_COMMIT_HASH_LENGTH);

      const stringifiedParams = [];

      stringifiedParams[VERSION_SEGMENT_INDEX] = version;

      if (newParams?.selectionStart && newParams?.selectionEnd) {
        stringifiedParams[SELECTION_SEGMENT_INDEX] = [
          encodePageNumberAndIndex(newParams.selectionStart.pageNumber, newParams.selectionStart.index),
          encodePageNumberAndIndex(newParams.selectionEnd.pageNumber, newParams.selectionEnd.index),
        ].join("");
      }

      window.location.hash = `${SEGMENT_SEPARATOR}${stringifiedParams.join(SEGMENT_SEPARATOR)}`;
    },
    [metadata],
  );

  const handleHashChange = useCallback(() => {
    const newHash = window.location.hash.substring(1);

    if (!newHash || !newHash.startsWith(SEGMENT_SEPARATOR)) {
      handleSetLocationParams();
      return;
    }

    const rawParams = newHash.split(SEGMENT_SEPARATOR).slice(1);

    const fullVersion = Object.keys(metadata.versions).find((version) =>
      version.startsWith(rawParams[VERSION_SEGMENT_INDEX]),
    );

    if (!fullVersion) {
      handleSetLocationParams();
      return;
    }

    const processedParams: ILocationParams = {
      version:
        Object.keys(metadata.versions).find((version) => version.startsWith(rawParams[VERSION_SEGMENT_INDEX])) ||
        metadata.latest,
    };

    if (rawParams[SELECTION_SEGMENT_INDEX]) {
      const matchedHexSegments = [...rawParams[SELECTION_SEGMENT_INDEX].matchAll(SELECTION_DECOMPOSE_PATTERN)];

      if (matchedHexSegments.length === 2) {
        processedParams.selectionStart = decodePageNumberAndIndex(matchedHexSegments[0][0]);
        processedParams.selectionEnd = decodePageNumberAndIndex(matchedHexSegments[1][0]);
      }
    }

    setLocationParams(processedParams);
  }, [handleSetLocationParams, metadata]);

  const synctexBlocksToSelectionParams: ILocationContext["synctexBlocksToSelectionParams"] = (blocks) => {
    const blockIds = blocks.map((block) => ({ pageNumber: block.pageNumber, index: block.index }));

    return {
      selectionStart: { pageNumber: blockIds[0].pageNumber, index: blockIds[0].index },
      selectionEnd: {
        pageNumber: blockIds[blockIds.length - 1].pageNumber,
        index: blockIds[blockIds.length - 1].index,
      },
    };
  };

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

  const context = { locationParams, setLocationParams: handleSetLocationParams, synctexBlocksToSelectionParams };

  return <LocationContext.Provider value={context}>{children}</LocationContext.Provider>;
}

function encodePageNumberAndIndex(pageNumber: number, index: number) {
  const asHexByte = (num: number) => (num & 0xff).toString(16).padStart(2, "0");
  return `${asHexByte(pageNumber)}${asHexByte(index)}${asHexByte(index >> 8)}`;
}

function decodePageNumberAndIndex(s: string) {
  if (s.length > 6) throw new Error("Pass exactly 6 hex characters");
  const fromHex = (s: string) => Number(`0x${s}`);
  const pageNumber = fromHex(s.substring(0, 2));
  let index = fromHex(s.substring(2, 4));
  index += fromHex(s.substring(4, 6)) << 8;
  return { pageNumber, index };
}
