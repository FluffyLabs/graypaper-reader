import { type Metadata, ORIGIN } from "./metadata";

export type Link = {
  raw: string;
  lineNumber: number;
  updated?: string;
  version: string;
  versionName: string;
  blocks: string;
  isValidInLatest?: boolean;
  isOutdated: boolean;
};

export function parseLink(lineNumber: number, link: string, meta: Metadata): Link {
  // remove the URL
  const href = link.replace(ORIGIN, "");
  // parse
  const parts = href.split("/");
  // seems like it's an old format of the links.
  if (parts[0] !== "#") {
    return {
      lineNumber,
      raw: link,
      version: "legacy",
      versionName: "legacy",
      blocks: "",
      isValidInLatest: false,
      isOutdated: true,
    };
  }

  const UNKNOWN = "unknown";
  const shortVersion = parts[1] || UNKNOWN;
  const blocks = parts[2] as string | undefined;
  const version = meta.shortMapping.get(shortVersion) || shortVersion;
  const versionName = meta.metadata.versions[version]?.name || version;

  const isOutdated = version !== meta.metadata.latest;
  let isValidInLatest = !isOutdated && blocks !== undefined;

  // check if the blocks are still there in the latest metadata
  if (isOutdated && blocks) {
    const hasLatestBlock = (encoded: string) => {
      const selection = decodePageNumberAndIndex(encoded);
      const blocks = meta.synctex.pages[selection.pageNumber];
      return blocks.findIndex((b) => b.index === selection.index) > -1;
    };

    const hasStart = hasLatestBlock(blocks.substring(0, 6));
    const hasEnd = hasLatestBlock(blocks.substring(6));

    isValidInLatest = hasStart && hasEnd;
  }

  return {
    raw: link,
    lineNumber,
    updated: `${ORIGIN}#/${meta.latestShort}/${blocks || UNKNOWN}`,
    version,
    versionName,
    blocks: blocks || UNKNOWN,
    isValidInLatest,
    isOutdated,
  };
}

function decodePageNumberAndIndex(s: string) {
  if (s.length !== 6) {
    return { pageNumber: 0, index: 0 };
  }
  const fromHex = (s: string) => Number(`0x${s}`);
  const pageNumber = fromHex(s.substring(0, 2));
  let index = fromHex(s.substring(2, 4));
  index += fromHex(s.substring(4, 6)) << 8;
  return { pageNumber, index };
}
