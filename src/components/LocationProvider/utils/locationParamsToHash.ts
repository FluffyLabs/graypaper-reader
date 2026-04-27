import type { IMetadataContext } from "../../MetadataProvider/MetadataProvider";
import type { ILocationParams, SearchParams } from "../types";
import {
  SEGMENT_SEPARATOR,
  SELECTION_SEGMENT_INDEX,
  SHORT_COMMIT_HASH_LENGTH,
  VERSION_SEGMENT_INDEX,
} from "./constants";
import { encodePageNumberAndIndex } from "./encodePageNumberAndIndex";

export const locationParamsToHash = (
  params: ILocationParams,
  metadata: IMetadataContext["metadata"],
  options: { includeSearchSection?: boolean } = {},
) => {
  const fullVersion = params.version;
  const version = fullVersion
    ? fullVersion.substring(0, SHORT_COMMIT_HASH_LENGTH)
    : (metadata.versions[metadata.latest]?.hash.substring(0, SHORT_COMMIT_HASH_LENGTH) ?? "");
  const versionName =
    (fullVersion
      ? (metadata.versions[fullVersion]?.name ?? (fullVersion === metadata.nightly?.hash ? "nightly" : null))
      : metadata.versions[metadata.latest]?.name) ?? "";

  const stringifiedParams = [];

  stringifiedParams[VERSION_SEGMENT_INDEX] = version;

  if (params.selectionStart && params.selectionEnd) {
    stringifiedParams[SELECTION_SEGMENT_INDEX] = [
      encodePageNumberAndIndex(params.selectionStart.pageNumber, params.selectionStart.index),
      encodePageNumberAndIndex(params.selectionEnd.pageNumber, params.selectionEnd.index),
    ].join("");
  }

  // search/section are URL-only "intents" consumed by Search input and Outline scroll.
  // They are normally dropped from the serialized URL once consumed; the redirect path
  // (when the URL had no resolvable version) opts in via `includeSearchSection` so the
  // pre-consumption values survive the rewrite.
  const finalParamsToSerialize: SearchParams = {
    v: versionName,
    rest: `${SEGMENT_SEPARATOR}${stringifiedParams.join(SEGMENT_SEPARATOR)}`,
  };

  if (options.includeSearchSection) {
    if (params.search) finalParamsToSerialize.search = params.search;
    if (params.section) finalParamsToSerialize.section = params.section;
  }

  if (params.split) {
    const splitName =
      metadata.versions[params.split]?.name ?? (params.split === metadata.nightly?.hash ? "nightly" : null);
    finalParamsToSerialize.split = splitName || params.split.substring(0, SHORT_COMMIT_HASH_LENGTH);
  }

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
