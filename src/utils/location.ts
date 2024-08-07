import type { InDocSelection } from "./IframeController";

export type LocationDetails = {
  shortVersion: string;
  page: string;
  section: string;
  subSection: string;
  selection: string[];
};

export function updateLocationVersion(version: string, hash: string): string | null {
  const loc = deserializeLocation(hash);
  if (loc === null) {
    return null;
  }

  loc.shortVersion = version.substring(0, 10);
  return reserializeLocation(loc);
}

export function reserializeLocation(loc: LocationDetails) {
  const l = JSON.stringify([
    loc.shortVersion,
    loc.page,
    loc.section,
    loc.subSection,
    loc.selection
  ]);

  return btoa(unescape(encodeURIComponent(l)));
}

export function serializeLocation(version: string, sel: InDocSelection) {
  const selectedNodes = Array.from(sel.selection.children ?? [])
    .map((x) => x.outerHTML)
    .filter(x => x.startsWith('<div class="'))
    .map(x => x.substring(0, x.indexOf('>') + 1))
  const loc = JSON.stringify([
    version.substring(0, 10),
    sel.location.page,
    sel.location.section?.title,
    sel.location.subSection?.title,
    selectedNodes.length ? [selectedNodes[0], selectedNodes[selectedNodes.length - 1]] : [],
  ]);

  return btoa(unescape(encodeURIComponent(loc)));
}

export function deserializeLocation(h: string): LocationDetails | null {
  if (h.length < 2) {
    return null;
  }

  const hash = h.startsWith("#") ? h.substring(1) : h;

  try {
    const decoded = atob(hash);
    const escaped = escape(decoded);
    const decoded2 = decodeURIComponent(escaped);
    const destringified = JSON.parse(decoded2);
    if (!Array.isArray(destringified)) {
      throw new Error(`parsed JSON is not an array: ${destringified} (${typeof destringified})`);
    }
    const [shortVersion, page, section, subSection, selection] = destringified;
    return { shortVersion, page, section, subSection, selection };
  } catch (e) {
    console.warn("unable to decode hash", hash);
    console.warn(e);
    return null;
  }
}
