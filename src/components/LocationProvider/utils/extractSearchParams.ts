import type { SearchParams } from "../types";

const ALLOWED_PARAMS = new Set<string>(["v", "search", "section", "split"]);

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function extractSearchParams(hash: string): SearchParams {
  // skip the leading '#'
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

  for (const param of searchParams.split("&")) {
    const eqIndex = param.indexOf("=");
    if (eqIndex === -1) continue;
    const key = param.substring(0, eqIndex);
    const val = param.substring(eqIndex + 1);
    if (ALLOWED_PARAMS.has(key)) {
      (result as { [key: string]: string | undefined })[key] = safeDecode(val);
    }
  }

  return result;
}
