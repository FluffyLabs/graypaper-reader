import type { ISelectionParams, ISynctexBlock } from "@fluffylabs/links-metadata";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { deserializeLegacyLocation } from "../../utils/deserializeLegacyLocation";
import { type IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";

export interface ILocationContext {
  locationParams: ILocationParams;
  setLocationParams: (newParams: ILocationParams) => void;
  synctexBlocksToSelectionParams: (blocks: ISynctexBlock[]) => ISelectionParams;
}

export interface ILocationParams extends Partial<ISelectionParams> {
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
      version: fullVersion,
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
    };
  }, [locationParams, handleSetLocationParams, synctexBlocksToSelectionParams]);

  if (!context) {
    return null;
  }

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
