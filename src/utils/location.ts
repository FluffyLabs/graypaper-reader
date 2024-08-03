import {InDocSelection} from "./IframeController";

export type LocationDetails = {
  version: string,
  page: number,
  section: string,
  subSection: string,
  selection: string[],
};

export function serializeLocation(version: string, sel: InDocSelection) {
  return JSON.stringify([
    version,
    sel.location.page,
    sel.location.section?.title,
    sel.location.subSection?.title,
    Array.from(sel.selection.children ?? []).map(x => x.outerHTML),
  ]);
}

export function deserializeLocation(hash: string): LocationDetails | null {
  try {
    const decoded = atob(hash.substring(1));
    const escaped = escape(decoded);
    const decoded2 = decodeURIComponent(escaped);
    const destringified = JSON.parse(decoded2);
    if (!Array.isArray(destringified)) {
      throw new Error(`parsed JSON is not an array: ${destringified} (${typeof destringified})`);
    }
    const [version, page, section, subSection, selection] = destringified;
    console.log(destringified);
    return { version, page, section, subSection, selection };
  } catch (e) {
    console.warn('unable to decode hash', hash);
    console.warn(e);
    return null;
  }
}
