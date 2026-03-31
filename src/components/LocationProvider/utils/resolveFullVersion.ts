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
  // Try matching by hash prefix first
  const byHash =
    Object.keys(metadata.versions).find((version) => version.startsWith(shortVersion)) ??
    (metadata.nightly?.hash.startsWith(shortVersion) ? metadata.nightly.hash : null);
  if (byHash) return byHash;
  // Try matching by friendly name (e.g. "0.5.3", "nightly")
  if (shortVersion.toLowerCase() === "nightly") return metadata.nightly?.hash ?? null;
  const byName = Object.values(metadata.versions).find((v) => v.name === shortVersion);
  return byName?.hash ?? null;
}
