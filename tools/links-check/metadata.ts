export type JsonMetadata = {
  latest: string;
  versions: {
    [version: string]: {
      name?: string;
      hash: string;
      date: string;
      legacy?: boolean;
    };
  };
};

export type SynctexBlock = {
  fileId: number;
  height: number;
  index: number;
  left: number;
  line: number;
  pageNumber: number;
  top: number;
  width: number;
};

export type JsonSynctex = {
  files: {
    [id: number]: string; // filename
  };
  pages: {
    [page: number]: SynctexBlock[];
  };
};

export type Metadata = {
  metadata: JsonMetadata;
  synctex: JsonSynctex;
  latestShort: string;
  /** Maps short version identifier into commit hash. */
  shortMapping: Map<string, string>;
};

export const ORIGIN = "https://graypaper.fluffylabs.dev/";

export async function fetchMetadata(): Promise<Metadata> {
  const controller = new AbortController();
  // set up some timeout for fetching
  const timeout = setTimeout(() => {
    controller.abort("timeout");
  }, 30_000);

  const meta = await fetch(`${ORIGIN}metadata.json`, {
    method: "GET",
    keepalive: true,
    signal: controller.signal,
  });

  if (!meta.ok) {
    throw new Error(`Unable to download metadata: ${await meta.text()}`);
  }

  const data = (await meta.json()) as JsonMetadata;
  // now fetch also synctex data for the latest version
  const synctexLink = `${ORIGIN}graypaper-${data.latest}.synctex.json`;
  const synctex = await fetch(synctexLink, {
    method: "GET",
    keepalive: false,
    signal: controller.signal,
  });

  let synctexData = {
    files: {},
    pages: {},
  };

  if (!synctex.ok) {
    console.warn(`Unable to fetch synctex data for the latest version at ${synctexLink}`);
  } else {
    synctexData = (await synctex.json()) as JsonSynctex;
  }

  clearTimeout(timeout);

  return {
    metadata: data,
    synctex: synctexData,
    latestShort: shortVersionId(data.latest),
    shortMapping: getShortVersionMapping(data),
  };
}

function getShortVersionMapping(data: JsonMetadata) {
  const res = new Map();
  for (const ver of Object.values(data.versions)) {
    res.set(shortVersionId(ver.hash), ver.hash);
  }
  return res;
}

function shortVersionId(hash: string) {
  const SHORT_COMMIT_HASH_LENGTH = 7; // as many as git uses for `git rev-parse --short`
  return hash.substring(0, SHORT_COMMIT_HASH_LENGTH);
}

export type Link = {
  raw: string;
  lineNumber: number;
  updated?: string;
  version: string;
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
      blocks: "",
      isValidInLatest: false,
      isOutdated: true,
    };
  }

  const UNKNOWN = "unknown";
  const shortVersion = parts[1] || UNKNOWN;
  const blocks = parts[2] as string | undefined;
  const version = meta.shortMapping.get(shortVersion) || shortVersion;

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
