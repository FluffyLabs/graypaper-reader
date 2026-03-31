import { describe, expect, it } from "vitest";
import { extractSearchParams } from "./utils/extractSearchParams";
import { resolveFullVersion } from "./utils/resolveFullVersion";

/**
 * Tests for the pure functions used by LocationProvider.
 * These run in Node (no DOM needed).
 */

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

describe("resolveFullVersion", () => {
  const metadata = {
    versions: {
      abc1234567890: { hash: "abc1234567890", name: "0.6.0" },
      def4567890123: { hash: "def4567890123", name: "0.5.3" },
    } as Record<string, { hash: string; name: string }>,
    nightly: { hash: "night1234567890" },
  };

  it("resolves by hash prefix", () => {
    expect(resolveFullVersion("abc1234", metadata)).toBe("abc1234567890");
  });

  it("resolves nightly by hash prefix", () => {
    expect(resolveFullVersion("night12", metadata)).toBe("night1234567890");
  });

  it("resolves 'nightly' literal (case-insensitive concept)", () => {
    expect(resolveFullVersion("nightly", metadata)).toBe("night1234567890");
  });

  it("resolves by friendly name", () => {
    expect(resolveFullVersion("0.5.3", metadata)).toBe("def4567890123");
  });

  it("returns null for empty string", () => {
    expect(resolveFullVersion("", metadata)).toBeNull();
  });

  it("returns null for unknown version", () => {
    expect(resolveFullVersion("zzz9999", metadata)).toBeNull();
  });

  it("prefers hash prefix over friendly name", () => {
    expect(resolveFullVersion("abc", metadata)).toBe("abc1234567890");
  });
});
