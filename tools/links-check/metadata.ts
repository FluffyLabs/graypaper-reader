export const ORIGIN = "https://graypaper.fluffylabs.dev/";

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
