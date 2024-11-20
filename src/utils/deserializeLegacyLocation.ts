export type LocationDetails = {
  shortVersion: string;
  page: string;
  section: string;
  subSection: string;
  selection: string[];
};

export function deserializeLegacyLocation(h: string): LocationDetails | null {
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
