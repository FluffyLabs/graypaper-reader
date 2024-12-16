import { migrateSelection } from "@fluffylabs/migrate-selection";
import type { SynctexStore, TexStore } from "@fluffylabs/synctex-store";
import type { ISynctexBlockId } from "@fluffylabs/types";
import { type Metadata, ORIGIN } from "./metadata";

export type Link = {
  url: string;
  lineNumber: number;
  updated: string | null;
  migrated: boolean;
  version: string;
  versionName: string;
  isOutdated: boolean;
};

export async function parseLink(
  lineNumber: number,
  url: string,
  meta: Metadata,
  synctexStore: SynctexStore,
  texStore: TexStore,
): Promise<Link> {
  // remove the URL
  const href = url.replace(ORIGIN, "");
  // parse
  const parts = href.split("/");
  // seems like it's an old format of the links.
  if (parts[0] !== "#") {
    return {
      lineNumber,
      url,
      updated: null,
      version: "legacy",
      versionName: "legacy",
      isOutdated: true,
      migrated: false,
    };
  }

  const UNKNOWN = "unknown";
  const shortVersion = parts[1] || UNKNOWN;
  const blocks = parts[2] as string | undefined;
  const version = meta.shortMapping.get(shortVersion) || shortVersion;
  const versionName = meta.metadata.versions[version]?.name || version;

  const isOutdated = version !== meta.metadata.latest;
  let updated: string | null = null;
  let migrated = false;

  // check if the blocks are still there in the latest metadata
  if (isOutdated && blocks) {
    const selectionStart = decodePageNumberAndIndex(blocks.substring(0, 6));
    const selectionEnd = decodePageNumberAndIndex(blocks.substring(6));

    const migratedSelection = await migrateSelection(
      { selectionStart, selectionEnd },
      version,
      meta.metadata.latest,
      synctexStore,
      texStore,
    );

    if (migratedSelection) {
      updated = `${ORIGIN}#/${meta.latestShort}/${encodePageNumberAndIndex(migratedSelection.selectionStart)}${encodePageNumberAndIndex(migratedSelection.selectionEnd)}`;
      migrated = true;
    } else {
      const latestSynctex = await synctexStore.getSynctex(meta.metadata.latest);
      const hasStart = !!latestSynctex.blocksByPage.get(selectionStart.pageNumber)?.[selectionStart.index];
      const hasEnd = !!latestSynctex.blocksByPage.get(selectionEnd.pageNumber)?.[selectionEnd.index];

      if (hasStart && hasEnd) {
        updated = `${ORIGIN}#/${meta.latestShort}/${blocks}`;
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
