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

export type Metadata = {
  metadata: JsonMetadata;
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

  clearTimeout(timeout);

  return {
    metadata: data,
    latestShort: shortVersionId(data.latest),
    shortMapping: getShortVersionMapping(data),
  };
}

export function synctexUrlGetter(version: string) {
  return `${ORIGIN}graypaper-${version}.synctex.json`;
}

export function texUrlGetter(version: string) {
  return `${ORIGIN}/tex-${version}`;
}

function getShortVersionMapping(data: JsonMetadata) {
  const res = new Map();
  for (const ver of Object.values(data.versions)) {
    res.set(shortVersionId(ver.hash), ver.hash);
  }
  return res;
}

export function shortVersionId(hash: string) {
  const SHORT_COMMIT_HASH_LENGTH = 7; // as many as git uses for `git rev-parse --short`
  return hash.substring(0, SHORT_COMMIT_HASH_LENGTH);
}
