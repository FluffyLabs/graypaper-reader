import { type ISelectionParams, type ISynctexBlock, isSameBlock } from "@fluffylabs/links-metadata";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { deserializeLegacyLocation } from "../../utils/deserializeLegacyLocation";
import { type IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";

export interface ILocationContext {
  locationParams: ILocationParams;
  setLocationParams: (newParams: ILocationParams) => void;
  synctexBlocksToSelectionParams: (blocks: ISynctexBlock[]) => ISelectionParams;
}

interface ILocationParams extends Partial<ISelectionParams> {
  version: string;
  search?: string;
  section?: string;
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
      const fullVersion = newParams?.version;
      const version = fullVersion
        ? fullVersion.substring(0, SHORT_COMMIT_HASH_LENGTH)
        : metadata.versions[metadata.latest]?.hash.substring(0, SHORT_COMMIT_HASH_LENGTH);
      const versionName = fullVersion ? metadata.versions[fullVersion]?.name : metadata.versions[metadata.latest]?.name;

      const stringifiedParams = [];

      stringifiedParams[VERSION_SEGMENT_INDEX] = version;

      if (newParams?.selectionStart && newParams?.selectionEnd) {
        stringifiedParams[SELECTION_SEGMENT_INDEX] = [
          encodePageNumberAndIndex(newParams.selectionStart.pageNumber, newParams.selectionStart.index),
          encodePageNumberAndIndex(newParams.selectionEnd.pageNumber, newParams.selectionEnd.index),
        ].join("");
      }

      // we never put search/section to the URL,
      // yet we keep them in `locationParams`.
      const params: SearchParams = {
        v: versionName,
        rest: `${SEGMENT_SEPARATOR}${stringifiedParams.join(SEGMENT_SEPARATOR)}`,
      };
      window.location.hash = serializeSearchParams(params);
    },
    [metadata],
  );

  const handleHashChange = useCallback(() => {
    const { rest: newHash, search, section } = extractSearchParams(window.location.hash);

    if (!newHash.startsWith(SEGMENT_SEPARATOR)) {
      const version = metadata.latest;
      setLocationParams((params) => ({
        ...params,
        version,
        search,
        section,
      }));
      handleSetLocationParams({ version, search, section });
      return;
    }

    const rawParams = newHash.split(SEGMENT_SEPARATOR).slice(1);
    const selectedVersion = rawParams[VERSION_SEGMENT_INDEX];

    const fullVersion =
      selectedVersion.length > 0
        ? Object.keys(metadata.versions).find((version) => version.startsWith(rawParams[VERSION_SEGMENT_INDEX]))
        : null;

    if (!fullVersion) {
      const version = metadata.latest;
      setLocationParams((params) => ({
        ...params,
        version,
        search,
        section,
      }));
      handleSetLocationParams({ version, search, section });
      return;
    }

    const newLocationParams: ILocationParams = {
      version: fullVersion,
      search,
      section,
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
      return params;
    });
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

type SearchParams = {
  rest: string;
  v?: string;
  search?: string;
  section?: string;
};

function extractSearchParams(hash: string): SearchParams {
  // skip the leading '/'
  const [rest, searchParams] = hash.substring(1).split("?");

  const result = {
    rest,
    v: undefined,
    search: undefined,
    section: undefined,
  };

  if (!searchParams) {
    return result;
  }

  for (const v of searchParams.split("&")) {
    const [key, val] = v.split("=");
    if (key in result) {
      (result as { [key: string]: string | undefined })[key] = decodeURIComponent(val);
    }
  }

  return result;
}
function serializeSearchParams({ rest, ...searchParams }: SearchParams) {
  const search = [];
  for (const key of Object.keys(searchParams)) {
    const val = searchParams[key as keyof typeof searchParams];
    if (val) {
      search.push(`${key}=${encodeURIComponent(val)}`);
    }
  }
  return `${rest}${search.length > 0 ? `?${search.join("&")}` : ""}`;
}
