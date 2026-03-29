import { describe, expect, it } from "vitest";
import type { IMetadata } from "../../MetadataProvider/MetadataProvider";
import type { ILocationParams } from "../types";
import { locationParamsToHash } from "./locationParamsToHash";

const metadata: IMetadata = {
  latest: "abc1234567890",
  versions: {
    abc1234567890: { hash: "abc1234567890", date: "2024-01-01", name: "0.6.0" },
    def4567890123: { hash: "def4567890123", date: "2024-02-01", name: "0.5.3" },
  },
  nightly: { hash: "night1234567890", date: "2024-03-01" },
};

describe("locationParamsToHash", () => {
  it("serializes version only", () => {
    const params: ILocationParams = { version: "abc1234567890" };
    const hash = locationParamsToHash(params, metadata);
    expect(hash).toBe("/abc1234?v=0.6.0");
  });

  it("serializes version with selection", () => {
    const params: ILocationParams = {
      version: "abc1234567890",
      selectionStart: { pageNumber: 1, index: 2 },
      selectionEnd: { pageNumber: 1, index: 5 },
    };
    const hash = locationParamsToHash(params, metadata);
    expect(hash).toContain("/abc1234/");
    expect(hash).toContain("?v=0.6.0");
  });

  it("serializes split with friendly name", () => {
    const params: ILocationParams = {
      version: "abc1234567890",
      split: "def4567890123",
    };
    const hash = locationParamsToHash(params, metadata);
    expect(hash).toContain("split=0.5.3");
    expect(hash).not.toContain("def4567");
  });

  it("serializes split with hash when no friendly name", () => {
    const params: ILocationParams = {
      version: "abc1234567890",
      split: "unknownhash1234",
    };
    const hash = locationParamsToHash(params, metadata);
    expect(hash).toContain("split=unknown");
  });

  it("serializes nightly split as 'nightly'", () => {
    const params: ILocationParams = {
      version: "abc1234567890",
      split: "night1234567890",
    };
    const hash = locationParamsToHash(params, metadata);
    expect(hash).toContain("split=nightly");
  });

  it("does not include split param when not set", () => {
    const params: ILocationParams = { version: "abc1234567890" };
    const hash = locationParamsToHash(params, metadata);
    expect(hash).not.toContain("split");
  });

  it("preserves selection when split is set", () => {
    const params: ILocationParams = {
      version: "abc1234567890",
      selectionStart: { pageNumber: 1, index: 2 },
      selectionEnd: { pageNumber: 1, index: 5 },
      split: "def4567890123",
    };
    const hash = locationParamsToHash(params, metadata);
    expect(hash).toContain("split=0.5.3");
    // Hash should have the selection segment between slashes
    const parts = hash.split("?")[0].split("/");
    expect(parts.length).toBe(3); // empty, version, selection
  });
});
