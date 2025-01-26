import type { SynctexStore } from "./SynctexStore";
import type { TexStore } from "./TexStore";
import { type Metadata, ORIGIN, shortVersionId } from "./metadata";
import { migrateSelection } from "./migrate";
import type { ISelectionParams, ISynctexBlockId } from "./types";

export type Link = {
  url: string;
  lineNumber: number;
  updated: string | null;
  migrated: boolean;
  version: string;
  versionName: string;
  isOutdated: boolean;
} & ISelectionParams;

export function findLink(line: string) {
  const linkStart = line.indexOf(ORIGIN);
  if (linkStart === -1) {
    return null;
  }
  // extract raw link
  const linkLine = line.substring(linkStart);
  // TODO [ToDr] we should probably look for some other delimiters as well (like closing brackets, new line, etc).
  const whitespaceIdx = linkLine.indexOf(" ");
  const link = whitespaceIdx !== -1 ? linkLine.substring(0, whitespaceIdx) : linkLine;
  return link;
}

export function parseLink(url: string, meta: Metadata) {
  // remove the URL
  const href = url.replace(ORIGIN, "");
  // parse
  const parts = href.split("/");
  // seems like it's an old format of the links.
  if (parts[0] !== "#") {
    return null;
  }

  const UNKNOWN = "unknown";
  const shortVersion = parts[1] || UNKNOWN;
  const blocks = parts[2] || "";
  const version = meta.shortMapping.get(shortVersion) || shortVersion;
  const versionName = meta.metadata.versions[version]?.name || version;

  const selectionStart = decodePageNumberAndIndex(blocks.substring(0, 6));
  const selectionEnd = decodePageNumberAndIndex(blocks.substring(6));

  return {
    shortVersion,
    version,
    versionName,
    blocks,
    selectionStart,
    selectionEnd,
  };
}

export async function parseAndMigrateLink(
  url: string,
  meta: Metadata,
  synctexStore: SynctexStore,
  texStore: TexStore,
  toVersion: string,
  lineNumber = 0,
): Promise<Link> {
  const linkData = parseLink(url, meta);
  if (linkData === null) {
    return {
      lineNumber,
      url,
      updated: null,
      version: "legacy",
      versionName: "legacy",
      isOutdated: true,
      migrated: false,
      selectionStart: { pageNumber: 0, index: 0 },
      selectionEnd: { pageNumber: 0, index: 0 },
    };
  }
  const { version, versionName, selectionStart, selectionEnd } = linkData;
  const isOutdated = version !== toVersion;
  let updated: string | null = null;
  let migrated = false;

  // check if the blocks are still there in the requested version of metadata
  if (isOutdated && selectionStart && selectionEnd) {
    const migratedSelection = await migrateSelection(
      { selectionStart, selectionEnd },
      version,
      toVersion,
      synctexStore,
      texStore,
    );

    const toVersionShort = shortVersionId(toVersion);
    if (migratedSelection) {
      updated = `${ORIGIN}#/${toVersionShort}/${encodePageNumberAndIndex(migratedSelection.selectionStart)}${encodePageNumberAndIndex(migratedSelection.selectionEnd)}`;
      migrated = true;
    } else {
      const toVersionSynctex = await synctexStore.getSynctex(toVersion);
      const hasStart = !!toVersionSynctex.blocksByPage.get(selectionStart.pageNumber)?.[selectionStart.index];
      const hasEnd = !!toVersionSynctex.blocksByPage.get(selectionEnd.pageNumber)?.[selectionEnd.index];

      if (hasStart && hasEnd) {
        updated = `${ORIGIN}#/${toVersionShort}/${linkData.blocks}`;
      }
    }
  }

  return {
    url,
    lineNumber,
    updated,
    version,
    versionName,
    isOutdated,
    migrated,
    selectionStart,
    selectionEnd,
  };
}

function decodePageNumberAndIndex(s: string): ISynctexBlockId {
  if (s.length !== 6) {
    return { pageNumber: 0, index: 0 };
  }
  const fromHex = (s: string) => Number(`0x${s}`);
  const pageNumber = fromHex(s.substring(0, 2));
  let index = fromHex(s.substring(2, 4));
  index += fromHex(s.substring(4, 6)) << 8;
  return { pageNumber, index };
}

function encodePageNumberAndIndex({ pageNumber, index }: ISynctexBlockId) {
  const asHexByte = (num: number) => (num & 0xff).toString(16).padStart(2, "0");
  return `${asHexByte(pageNumber)}${asHexByte(index)}${asHexByte(index >> 8)}`;
}
