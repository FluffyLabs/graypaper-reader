import type { Metadata } from "./Version";

export function getLatestVersion(metadata: Metadata) {
  return metadata.latest ?? "latest";
}
