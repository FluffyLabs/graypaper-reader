interface VersionInfo {
  hash: string;
  name?: string;
}

interface ResolveVersionInput {
  versions: Record<string, VersionInfo>;
  nightly?: { hash: string } | null;
}

export function resolveFullVersion(shortVersion: string, metadata: ResolveVersionInput): string | null {
  if (shortVersion.length === 0) return null;
  // Try matching by hash prefix first (using VersionInfo.hash, not the record key)
  const hashMatches = [
    ...Object.values(metadata.versions).map((v) => v.hash),
    ...(metadata.nightly?.hash ? [metadata.nightly.hash] : []),
  ].filter((hash) => hash.startsWith(shortVersion));
  if (hashMatches.length === 1) return hashMatches[0];
  if (hashMatches.length > 1) return null;
  // Try matching by friendly name (e.g. "0.5.3", "nightly")
  if (shortVersion.toLowerCase() === "nightly") return metadata.nightly?.hash ?? null;
  const byName = Object.values(metadata.versions).find((v) => v.name === shortVersion);
  return byName?.hash ?? null;
}
