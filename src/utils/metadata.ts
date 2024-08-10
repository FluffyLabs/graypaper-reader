import { deserializeLocation } from "../utils/location";

import originalMetadata from "../../public/metadata.json";

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

export const grayPaperMetadata: Metadata = originalMetadata;

export function getInitialVersion(metadata: Metadata): string {
  const loc = deserializeLocation(window.location.hash);
  const version = findVersion(loc?.shortVersion ?? null, metadata);
  if (version) {
    return version;
  }

  return getLatestVersion(grayPaperMetadata);
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
