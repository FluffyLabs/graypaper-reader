import type { IMetadataContext } from "../../MetadataProvider/MetadataProvider";
import type { ILocationParams, SearchParams } from "../types";
import {
  SEGMENT_SEPARATOR,
  SELECTION_SEGMENT_INDEX,
  SHORT_COMMIT_HASH_LENGTH,
  VERSION_SEGMENT_INDEX,
} from "./constants";
import { encodePageNumberAndIndex } from "./encodePageNumberAndIndex";

export const locationParamsToHash = (params: ILocationParams, metadata: IMetadataContext["metadata"]) => {
  const fullVersion = params.version;
  const version = fullVersion
    ? fullVersion.substring(0, SHORT_COMMIT_HASH_LENGTH)
    : metadata.versions[metadata.latest]?.hash.substring(0, SHORT_COMMIT_HASH_LENGTH);
  const versionName = fullVersion ? metadata.versions[fullVersion]?.name : metadata.versions[metadata.latest]?.name;

  const stringifiedParams = [];

  stringifiedParams[VERSION_SEGMENT_INDEX] = version;

  if (params.selectionStart && params.selectionEnd) {
    stringifiedParams[SELECTION_SEGMENT_INDEX] = [
      encodePageNumberAndIndex(params.selectionStart.pageNumber, params.selectionStart.index),
      encodePageNumberAndIndex(params.selectionEnd.pageNumber, params.selectionEnd.index),
    ].join("");
  }

  // we never put search/section to the URL,
  // yet we keep them in `locationParams`.
  const finalParamsToSerialize: SearchParams = {
    v: versionName,
    rest: `${SEGMENT_SEPARATOR}${stringifiedParams.join(SEGMENT_SEPARATOR)}`,
  };

  return serializeSearchParams(finalParamsToSerialize);
};

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
