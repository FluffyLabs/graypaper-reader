import { deserializeLocation } from "../utils/location";

const METADATA_HOST = import.meta.env.MODE === "development" ? "/public" : "https://gp.fluffylabs.dev";
const METADATA_JSON = `${METADATA_HOST}/metadata.json`;

export type VersionInfo = {
  hash: string;
  date: string;
};

export type Metadata = {
  latest: string;
  versions: {
    [key: string]: VersionInfo;
  };
};

let metadataCache: Promise<Metadata> | null = null;

export async function getMetadata(): Promise<Metadata> {
  if (metadataCache) {
    return await metadataCache;
  }

  metadataCache = fetch(METADATA_JSON).then((response) => response.json());
  return await metadataCache;
}

export function getInitialVersion(metadata: Metadata): string {
  const loc = deserializeLocation(window.location.hash);
  const version = findVersion(loc?.shortVersion ?? null, metadata);
  if (version) {
    return version;
  }

  return getLatestVersion(metadata);
}

export function findVersion(shortVersion: string | null, metadata: Metadata) {
  if (!shortVersion) {
    return null;
  }

  return Object.keys(metadata.versions).find((v) => v.startsWith(shortVersion)) ?? null;
}

export function getLatestVersion(metadata: Metadata) {
  return metadata.latest ?? "latest";
}

export function grayPaperUrl(version: string) {
  return `${METADATA_HOST}/graypaper-${version}.html`;
}
