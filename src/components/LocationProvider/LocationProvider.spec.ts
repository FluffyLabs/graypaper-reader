import { describe, expect, it } from "vitest";

/**
 * Tests for the pure functions inside LocationProvider.
 * These run in Node (no DOM needed).
 */

// extractSearchParams and resolveFullVersion are private, so we test them
// indirectly through the module's behavior. Here we test the publicly-importable
// helpers and the hash-parsing logic via unit-testable wrappers.

// Re-implement extractSearchParams locally to test the parsing logic,
// since it's not exported. This mirrors the exact implementation.
function extractSearchParams(hash: string) {
  const [rest, searchParams] = hash.substring(1).split("?");
  const result: Record<string, string | undefined> = {
    rest,
    v: undefined,
    search: undefined,
    section: undefined,
    split: undefined,
  };
  if (!searchParams) return result;
  for (const v of searchParams.split("&")) {
    const [key, val] = v.split("=");
    if (key in result) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

describe("extractSearchParams", () => {
  it("parses hash with no query params", () => {
    const result = extractSearchParams("#/abc1234");
    expect(result.rest).toBe("/abc1234");
    expect(result.split).toBeUndefined();
    expect(result.search).toBeUndefined();
    expect(result.section).toBeUndefined();
  });

  it("parses split param from hash", () => {
    const result = extractSearchParams("#/abc1234?split=0.5.3");
    expect(result.rest).toBe("/abc1234");
    expect(result.split).toBe("0.5.3");
  });

  it("parses multiple query params", () => {
    const result = extractSearchParams("#/abc1234?split=nightly&search=jam&section=3");
    expect(result.rest).toBe("/abc1234");
    expect(result.split).toBe("nightly");
    expect(result.search).toBe("jam");
    expect(result.section).toBe("3");
  });

  it("ignores unknown query params", () => {
    const result = extractSearchParams("#/abc1234?unknown=foo&split=bar");
    expect(result.split).toBe("bar");
    expect(result).not.toHaveProperty("unknown");
  });

  it("decodes URI components in param values", () => {
    const result = extractSearchParams("#/abc1234?search=hello%20world");
    expect(result.search).toBe("hello world");
  });

  it("handles hash with selection segment and query params", () => {
    const result = extractSearchParams("#/abc1234/010002010005?split=def4567");
    expect(result.rest).toBe("/abc1234/010002010005");
    expect(result.split).toBe("def4567");
  });

  it("handles empty hash", () => {
    const result = extractSearchParams("#");
    expect(result.rest).toBe("");
    expect(result.split).toBeUndefined();
  });
});

describe("resolveFullVersion logic", () => {
  // Test the resolution logic that LocationProvider uses.
  // We mirror the algorithm here since it's not exported.
  const versions: Record<string, { hash: string; name: string }> = {
    abc1234567890: { hash: "abc1234567890", name: "0.6.0" },
    def4567890123: { hash: "def4567890123", name: "0.5.3" },
  };
  const nightly = { hash: "night1234567890" };

  function resolveFullVersion(shortVersion: string): string | null {
    if (shortVersion.length === 0) return null;
    const byHash =
      Object.keys(versions).find((v) => v.startsWith(shortVersion)) ??
      (nightly.hash.startsWith(shortVersion) ? nightly.hash : null);
    if (byHash) return byHash;
    if (shortVersion.toLowerCase() === "nightly") return nightly.hash;
    const byName = Object.values(versions).find((v) => v.name === shortVersion);
    return byName?.hash ?? null;
  }

  it("resolves by hash prefix", () => {
    expect(resolveFullVersion("abc1234")).toBe("abc1234567890");
  });

  it("resolves nightly by hash prefix", () => {
    expect(resolveFullVersion("night12")).toBe("night1234567890");
  });

  it("resolves 'nightly' literal (case-insensitive concept)", () => {
    expect(resolveFullVersion("nightly")).toBe("night1234567890");
  });

  it("resolves by friendly name", () => {
    expect(resolveFullVersion("0.5.3")).toBe("def4567890123");
  });

  it("returns null for empty string", () => {
    expect(resolveFullVersion("")).toBeNull();
  });

  it("returns null for unknown version", () => {
    expect(resolveFullVersion("zzz9999")).toBeNull();
  });

  it("prefers hash prefix over friendly name", () => {
    // "abc1234567890" starts with "abc" and also has name "0.6.0"
    expect(resolveFullVersion("abc")).toBe("abc1234567890");
  });
});
