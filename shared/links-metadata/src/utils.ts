import type { ISynctexBlockId } from "./types";

export function isSameBlock(a?: ISynctexBlockId | null, b?: ISynctexBlockId | null) {
  if (a === b) {
    return true;
  }

  return a?.pageNumber === b?.pageNumber && a?.index === b?.index;
}
