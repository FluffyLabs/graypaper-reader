export type JsonMetadata = {
  latest: string,
  versions: {
    [version: string]: {
      name?: string,
      hash: string,
      date: string,
      legacy?: boolean,
    }
  }
};

export type Metadata = {
  metadata: JsonMetadata,
  latestShort: string,
  /** Maps short version identifier into commit hash. */
  shortMapping: Map<string, string>,
}


export const ORIGIN = 'https://graypaper.fluffylabs.dev/';

export async function fetchMetadata(): Promise<Metadata> {
  const controller = new AbortController();
  // set up some timeout for fetching
  const timeout = setTimeout(() => {
    controller.abort('timeout');
  }, 30_000);

  const meta = await fetch('https://graypaper.fluffylabs.dev/metadata.json', {
    method: 'GET',
    keepalive: true,
    signal: controller.signal,
  });

  if (!meta.ok) {
    throw new Error(`Unable to download metadata: ${await meta.text()}`);
  }

  const data = await meta.json() as JsonMetadata;

  clearTimeout(timeout);

  return {
    metadata: data,
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
  updated?: string;
  version: string;
  blocks: string;
  isValid?: boolean;
  isOutdated: boolean;
};

export function parseLink(link: string, meta: Metadata): Link {
  // remove the URL
  const href = link.replace(ORIGIN, '');
  // parse
  const parts = href.split('/');
  // seems like it's an old format of the links.
  if (parts[0] !== '#') {
    return {
      raw: link,
      version: 'legacy',
      blocks: '',
      isOutdated: true,
    }
  }

  const shortVersion = parts[1];
  const blocks = parts[2];
  const UNKNOWN = 'unknown';
  const version = meta.shortMapping.get(shortVersion) || shortVersion || UNKNOWN;

  return {
    raw: link,
    updated: `${ORIGIN}#/${meta.latestShort}/${blocks || UNKNOWN}`,
    version,
    blocks: blocks || UNKNOWN,
    isValid: shortVersion !== undefined && blocks !== undefined,
    isOutdated: version !== meta.metadata.latest,
  };
}

export function linkToLatest(link: Link, metadata: Metadata) {
  return
}
