import type { SearchParams } from "../types";

export function extractSearchParams(hash: string): SearchParams {
  // skip the leading '/'
  const [rest, searchParams] = hash.substring(1).split("?");

  const result: SearchParams = {
    rest,
    v: undefined,
    search: undefined,
    section: undefined,
    split: undefined,
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
